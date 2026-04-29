import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

/**
 * AI Context Layer
 *
 * Provides structured, pre-assembled context payloads that downstream AI
 * features (summarisation, scoring, next-best-action, etc.) can consume
 * directly without having to join across multiple tables themselves.
 *
 * Endpoints:
 *   GET /ai-context/account/:accountId   → full account context bundle
 *   GET /ai-context/contact/:contactId   → full contact context bundle
 */
@Injectable()
export class AiContextService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Account Context ────────────────────────────────────────────────────────
  async getAccountContext(tenantId: string, accountId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: accountId, tenantId },
        include: {
          contacts: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isOptedOut: true,
              optedOutAt: true,
              optOutReason: true,
            },
          },
          deals: {
            select: {
              id: true,
              name: true,
              stage: true,
              amount: true,
            },
          },
          interactions: {
            include: {
              participants: {
                include: {
                  contact: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                      isOptedOut: true,
                    },
                  },
                },
              },
            },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!account) {
        throw new NotFoundException(`Account ${accountId} not found for tenant ${tenantId}`);
      }

      // ── Build structured AI-ready context ──────────────────────────────
      const interactionsByType = {
        email: 0,
        call: 0,
        meeting: 0,
      };
      for (const i of account.interactions) {
        const t = i.type as keyof typeof interactionsByType;
        if (t in interactionsByType) interactionsByType[t]++;
      }

      const uniqueContacts = new Map<string, { email: string; name: string | null; optedOut: boolean }>();
      for (const c of account.contacts) {
        uniqueContacts.set(c.id, {
          email: c.email,
          name: [c.firstName, c.lastName].filter(Boolean).join(' ') || null,
          optedOut: c.isOptedOut,
        });
      }

      const timeline = account.interactions.map((i) => ({
        id: i.id,
        type: i.type,
        timestamp: i.timestamp,
        summary: i.summary,
        subject: i.subject,
        direction: i.direction,
        participants: i.participants.map((p) => ({
          email: p.email,
          role: p.role,
          name: [p.contact?.firstName, p.contact?.lastName].filter(Boolean).join(' ') || null,
          optedOut: p.contact?.isOptedOut ?? false,
        })),
      }));

      const firstInteraction = timeline.length > 0 ? timeline[timeline.length - 1].timestamp : null;
      const lastInteraction = timeline.length > 0 ? timeline[0].timestamp : null;

      return {
        _meta: {
          type: 'account_context',
          version: '1.0',
          generatedAt: new Date().toISOString(),
          tenantId,
        },
        account: {
          id: account.id,
          name: account.name,
          domain: account.domain,
        },
        summary: {
          totalInteractions: account.interactions.length,
          interactionsByType,
          totalContacts: uniqueContacts.size,
          totalDeals: account.deals.length,
          optedOutContacts: [...uniqueContacts.values()].filter((c) => c.optedOut).length,
          firstInteraction,
          lastInteraction,
        },
        contacts: [...uniqueContacts.values()],
        deals: account.deals.map((d) => ({
          id: d.id,
          name: d.name,
          stage: d.stage,
          amount: d.amount,
        })),
        timeline,
      };
    });
  }

  // ── Contact Context ────────────────────────────────────────────────────────
  async getContactContext(tenantId: string, contactId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, async (tx) => {
      const contact = await tx.contact.findFirst({
        where: { id: contactId, tenantId },
        include: {
          account: {
            select: { id: true, name: true, domain: true },
          },
          participants: {
            include: {
              interaction: {
                select: {
                  id: true,
                  type: true,
                  timestamp: true,
                  summary: true,
                  subject: true,
                  direction: true,
                },
              },
            },
            orderBy: { interaction: { timestamp: 'desc' } },
          },
          dealContacts: {
            include: {
              deal: {
                select: { id: true, name: true, stage: true, amount: true },
              },
            },
          },
        },
      });

      if (!contact) {
        throw new NotFoundException(`Contact ${contactId} not found for tenant ${tenantId}`);
      }

      const interactionsByType = { email: 0, call: 0, meeting: 0 };
      const interactions = contact.participants.map((p) => {
        const t = p.interaction.type as keyof typeof interactionsByType;
        if (t in interactionsByType) interactionsByType[t]++;
        return {
          id: p.interaction.id,
          type: p.interaction.type,
          timestamp: p.interaction.timestamp,
          summary: p.interaction.summary,
          subject: p.interaction.subject,
          direction: p.interaction.direction,
          role: p.role,
        };
      });

      const firstInteraction = interactions.length > 0 ? interactions[interactions.length - 1].timestamp : null;
      const lastInteraction = interactions.length > 0 ? interactions[0].timestamp : null;

      return {
        _meta: {
          type: 'contact_context',
          version: '1.0',
          generatedAt: new Date().toISOString(),
          tenantId,
        },
        contact: {
          id: contact.id,
          email: contact.email,
          name: [contact.firstName, contact.lastName].filter(Boolean).join(' ') || null,
          isOptedOut: contact.isOptedOut,
          optedOutAt: contact.optedOutAt,
          optOutReason: contact.optOutReason,
        },
        account: contact.account,
        summary: {
          totalInteractions: interactions.length,
          interactionsByType,
          totalDeals: contact.dealContacts.length,
          firstInteraction,
          lastInteraction,
        },
        deals: contact.dealContacts.map((dc) => ({
          id: dc.deal.id,
          name: dc.deal.name,
          stage: dc.deal.stage,
          amount: dc.deal.amount,
          role: dc.role,
        })),
        timeline: interactions,
      };
    });
  }
}
