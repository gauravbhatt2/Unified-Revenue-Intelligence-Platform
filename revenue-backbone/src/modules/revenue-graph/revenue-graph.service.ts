import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NormalizedInteraction } from '../normalization/normalized-interaction.interface';
import { ResolvedContact } from '../resolution/resolved-contact.interface';

interface BuildGraphInput {
  tenantId: string;
  normalized: NormalizedInteraction;
  resolvedContacts: ResolvedContact[];
  dealId?: string;
  tx?: any;
}

@Injectable()
export class RevenueGraphService {
  private readonly logger = new Logger(RevenueGraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildGraph(input: BuildGraphInput) {
    const { tenantId, normalized, resolvedContacts, dealId, tx } = input;
    const db = tx ?? this.prisma;

    // Determine the primary account from the first resolved contact that has one
    const primaryAccountId = resolvedContacts.find((c) => c.accountId)?.accountId ?? null;

    // Validate dealId if provided
    let validatedDealId: string | null = null;
    if (dealId) {
      const deal = await db.deal.findFirst({ where: { id: dealId, tenantId } });
      if (!deal) {
        this.logger.warn(`Deal ${dealId} not found for tenant ${tenantId}, ignoring dealId`);
      } else {
        validatedDealId = deal.id;
      }
    }

    // Create the interaction record
    const interaction = await db.interaction.create({
      data: {
        tenantId,
        accountId: primaryAccountId,
        dealId: validatedDealId,
        type: normalized.type,
        timestamp: normalized.timestamp,
        summary: normalized.summary,
        subject: normalized.subject,
        direction: normalized.direction,
        sourceId: normalized.sourceId,
      },
    });

    this.logger.log(`Interaction created: ${interaction.id} (type=${interaction.type})`);

    // Create interaction_participants — the CORE edge table
    for (const rc of resolvedContacts) {
      await db.interactionParticipant.upsert({
        where: {
          interactionId_contactId: {
            interactionId: interaction.id,
            contactId: rc.contactId,
          },
        },
        update: {},
        create: {
          tenantId,
          interactionId: interaction.id,
          contactId: rc.contactId,
          email: rc.email,
          role: rc.role,
        },
      });

      this.logger.log(`Participant linked: contact=${rc.contactId} → interaction=${interaction.id}`);
    }

    return interaction;
  }

  async getInteractionsByAccount(tenantId: string, accountId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.interaction.findMany({
        where: { tenantId, accountId },
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
                  optedOutAt: true,
                  optOutReason: true,
                  accountId: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
    );
  }

  async getInteractionsByDeal(tenantId: string, dealId: string) {
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.interaction.findMany({
        where: { tenantId, dealId },
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
                  optedOutAt: true,
                  optOutReason: true,
                  accountId: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
    );
  }
}
