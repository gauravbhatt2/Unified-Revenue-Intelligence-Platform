import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NormalizedParticipant } from '../normalization/normalized-interaction.interface';
import { ResolvedContact } from './resolved-contact.interface';
import { Prisma } from '@prisma/client';

const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com']);

@Injectable()
export class ResolutionService {
  private readonly logger = new Logger(ResolutionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve or create a contact by exact email match (case-insensitive).
   * Also resolves account by email domain.
   */
  async resolveParticipants(
    tenantId: string,
    participants: NormalizedParticipant[],
    tx?: any,
  ): Promise<ResolvedContact[]> {
    const resolved: ResolvedContact[] = [];

    for (const participant of participants) {
      const resolvedContact = await this.resolveContact(tenantId, participant, tx);
      resolved.push(resolvedContact);
    }

    return resolved;
  }

  private async resolveContact(
    tenantId: string,
    participant: NormalizedParticipant,
    tx?: any,
  ): Promise<ResolvedContact> {
    const db = tx ?? this.prisma;
    const email = participant.email.toLowerCase().trim();

    // Exact email match (case-insensitive via normalized email stored lowercase)
    let contact = await db.contact.findUnique({
      where: { tenantId_email: { tenantId, email } },
    });

    if (contact) {
      this.logger.log(`Contact resolved by email: ${email} → ${contact.id}`);
      return {
        contactId: contact.id,
        email: contact.email,
        accountId: contact.accountId,
        isNew: false,
        role: participant.role,
      };
    }

    // Contact not found → resolve account by domain, then create contact
    const domain = this.extractDomain(email);
    const account = await this.resolveOrCreateAccount(tenantId, domain, tx);

    try {
      contact = await db.contact.create({
        data: {
          tenantId,
          email,
          firstName: participant.firstName,
          lastName: participant.lastName,
          accountId: account?.id ?? null,
        },
      });
      this.logger.log(`New contact created: ${email} → ${contact.id}`);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Unique constraint violation: another request created the same contact concurrently
        contact = await db.contact.findUnique({
          where: { tenantId_email: { tenantId, email } },
        });
        if (!contact) {
          throw err;
        }
        this.logger.warn(`Contact race condition resolved for ${email} → ${contact.id}`);
      } else {
        throw err;
      }
    }

    return {
      contactId: contact.id,
      email: contact.email,
      accountId: contact.accountId,
      isNew: true,
      role: participant.role,
    };
  }

  /**
   * Resolve account by email domain. Creates account if it doesn't exist.
   * Public email domains (gmail, yahoo, outlook) are never used as accounts.
   */
  private async resolveOrCreateAccount(tenantId: string, domain: string, tx?: any) {
    const db = tx ?? this.prisma;
    if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) return null;
    const account = await db.account.upsert({
      where: { tenantId_domain: { tenantId, domain } },
      update: {},
      create: {
        tenantId,
        name: domain,
        domain,
      },
    });
    this.logger.log(`Account resolved for domain: ${domain} → ${account.id}`);
    return account;
  }

  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1].toLowerCase() : '';
  }
}
