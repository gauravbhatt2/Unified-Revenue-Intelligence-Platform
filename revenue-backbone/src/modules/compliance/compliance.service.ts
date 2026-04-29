import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ComplianceExportMode } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async optOut(tenantId: string, contactId: string, reason?: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const contact = await this.prisma.withTenant(tenantId, (tx) =>
      tx.contact.findFirst({
        where: { id: contactId, tenantId },
      }),
    );

    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found for tenant ${tenantId}`);
    }

    const updated: any = await this.prisma.withTenant(tenantId, (tx) =>
      tx.contact.update({
        where: { id: contactId },
        data: {
          isOptedOut: true,
          optedOutAt: new Date(),
          optOutReason: reason?.trim() || 'manual opt-out',
        },
      }),
    );

    return {
      contactId: updated.id,
      email: updated.email,
      isOptedOut: updated.isOptedOut,
      optedOutAt: updated.optedOutAt,
      optOutReason: updated.optOutReason,
      message: 'Contact has been opted out successfully',
    };
  }

  async optIn(tenantId: string, contactId: string) {
    if (!tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    const contact = await this.prisma.withTenant(tenantId, (tx) =>
      tx.contact.findFirst({
        where: { id: contactId, tenantId },
      }),
    );

    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} not found for tenant ${tenantId}`);
    }

    const updated: any = await this.prisma.withTenant(tenantId, (tx) =>
      tx.contact.update({
        where: { id: contactId },
        data: {
          isOptedOut: false,
          optedOutAt: null,
          optOutReason: null,
        },
      }),
    );

    return {
      contactId: updated.id,
      email: updated.email,
      isOptedOut: updated.isOptedOut,
      optedOutAt: updated.optedOutAt,
      optOutReason: updated.optOutReason,
      message: 'Contact has been opted back in',
    };
  }

  filterOptedOut(interactions: any[]) {
    return interactions.filter((interaction) =>
      interaction.participants?.every((p: any) => !p.contact?.isOptedOut),
    );
  }

  redactOptedOut(interactions: any[]) {
    return interactions.map((interaction) => ({
      ...interaction,
      participants: interaction.participants?.map((p: any) => {
        if (!p.contact?.isOptedOut) return p;
        return {
          ...p,
          email: 'redacted@privacy.local',
          contact: {
            ...p.contact,
            email: 'redacted@privacy.local',
            firstName: null,
            lastName: null,
          },
        };
      }),
    }));
  }

  countOptedOutParticipants(interactions: any[]) {
    return interactions.reduce(
      (count, interaction) =>
        count + (interaction.participants?.filter((p: any) => p.contact?.isOptedOut).length || 0),
      0,
    );
  }

  async getSettings(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const settings: any = await this.prisma.withTenant(tenantId, (tx) =>
      tx.complianceSetting.upsert({
        where: { tenantId },
        create: { tenantId, exportMode: ComplianceExportMode.EXCLUDE_INTERACTION },
        update: {},
      }),
    );

    return settings;
  }

  async updateSettings(tenantId: string, mode: ComplianceExportMode) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.complianceSetting.upsert({
        where: { tenantId },
        create: { tenantId, exportMode: mode },
        update: { exportMode: mode },
      }),
    );
  }
}
