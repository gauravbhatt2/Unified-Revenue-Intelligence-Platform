import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
  ) {}

  async exportByAccount(
    tenantId: string,
    accountId: string,
    format: 'json' | 'csv' = 'json',
    requestedBy?: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, async (tx) => {
      const account = await tx.account.findFirst({ where: { id: accountId, tenantId } });
      if (!account) throw new NotFoundException(`Account ${accountId} not found for tenant ${tenantId}`);

      const interactions = await tx.interaction.findMany({
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
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const { interactions: compliantInteractions, excludedCount, redactedCount } =
        await this.applyCompliance(tenantId, interactions);

      // Log export with compliance metadata
      const accountLogData: Prisma.ExportLogUncheckedCreateInput = {
        tenantId,
        scope: 'account',
        scopeId: accountId,
        format,
        recordCount: compliantInteractions.length,
        excludedCount,
        redactedCount,
        requestedBy,
        filters: { accountId },
      };
      await tx.exportLog.create({ data: accountLogData });

      if (format === 'csv') {
        return {
          content: this.toCSV(compliantInteractions),
          totalInteractions: compliantInteractions.length,
          excludedCount,
          redactedCount,
        };
      }

      return {
        account: { id: account.id, name: account.name, domain: account.domain },
        totalInteractions: compliantInteractions.length,
        excludedCount,
        redactedCount,
        interactions: compliantInteractions.map((i) => this.formatInteraction(i)),
      };
    });
  }

  async exportByDeal(
    tenantId: string,
    dealId: string,
    format: 'json' | 'csv' = 'json',
    requestedBy?: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, async (tx) => {
      const deal = await tx.deal.findFirst({ where: { id: dealId, tenantId } });
      if (!deal) throw new NotFoundException(`Deal ${dealId} not found for tenant ${tenantId}`);

      const interactions = await tx.interaction.findMany({
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
                },
              },
            },
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      const { interactions: compliantInteractions, excludedCount, redactedCount } =
        await this.applyCompliance(tenantId, interactions);

    const dealLogData: Prisma.ExportLogUncheckedCreateInput = {
      tenantId,
      scope: 'deal',
      scopeId: dealId,
      format,
      recordCount: compliantInteractions.length,
      excludedCount,
      redactedCount,
      requestedBy,
      filters: { dealId },
    };
      await tx.exportLog.create({ data: dealLogData });

      if (format === 'csv') {
        return {
          content: this.toCSV(compliantInteractions),
          totalInteractions: compliantInteractions.length,
          excludedCount,
          redactedCount,
        };
      }

      return {
        deal: { id: deal.id, name: deal.name, stage: deal.stage, amount: deal.amount },
        totalInteractions: compliantInteractions.length,
        excludedCount,
        redactedCount,
        interactions: compliantInteractions.map((i) => this.formatInteraction(i)),
      };
    });
  }

  async getExportLogs(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.prisma.withTenant(tenantId, (tx) =>
      tx.exportLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  private async applyCompliance(tenantId: string, interactions: any[]) {
    const settings: any = await this.compliance.getSettings(tenantId);

    if (settings.exportMode === 'REDACT_PARTICIPANT') {
      return {
        interactions: this.compliance.redactOptedOut(interactions),
        excludedCount: 0,
        redactedCount: this.compliance.countOptedOutParticipants(interactions),
      };
    }

    const compliantInteractions = this.compliance.filterOptedOut(interactions);
    return {
      interactions: compliantInteractions,
      excludedCount: interactions.length - compliantInteractions.length,
      redactedCount: 0,
    };
  }

  private formatInteraction(interaction: any) {
    return {
      id: interaction.id,
      type: interaction.type,
      timestamp: interaction.timestamp,
      summary: interaction.summary,
      subject: interaction.subject,
      direction: interaction.direction,
      participants: interaction.participants.map((p: any) => ({
        email: p.email,
        role: p.role,
        contactId: p.contactId,
        name: [p.contact?.firstName, p.contact?.lastName].filter(Boolean).join(' ') || null,
      })),
    };
  }

  private toCSV(interactions: any[]): string {
    const headers = ['interaction_id', 'type', 'timestamp', 'summary', 'subject', 'direction', 'participant_email', 'participant_role', 'participant_name'];

    const rows: string[][] = [];

    for (const interaction of interactions) {
      if (interaction.participants.length === 0) {
        rows.push([
          interaction.id,
          interaction.type,
          interaction.timestamp?.toISOString() ?? '',
          interaction.summary ?? '',
          interaction.subject ?? '',
          interaction.direction ?? '',
          '', '', '',
        ]);
      } else {
        for (const p of interaction.participants) {
          rows.push([
            interaction.id,
            interaction.type,
            interaction.timestamp?.toISOString() ?? '',
            interaction.summary ?? '',
            interaction.subject ?? '',
            interaction.direction ?? '',
            p.email,
            p.role ?? '',
            [p.contact?.firstName, p.contact?.lastName].filter(Boolean).join(' '),
          ]);
        }
      }
    }

    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const csvLines = [
      headers.join(','),
      ...rows.map((r) => r.map(escape).join(',')),
    ];

    return csvLines.join('\n');
  }
}
