import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

/**
 * Data Cloud Service
 *
 * Handles outbound data sync — pushing structured revenue data to
 * client-owned external systems via webhook URLs or API endpoints.
 *
 * Supports:
 *   - Webhook-based push (POST to client URL)
 *   - Retry logic with exponential backoff
 *   - Per-tenant destination configuration
 *   - Full sync logging
 */
@Injectable()
export class DataCloudService {
  private readonly logger = new Logger(DataCloudService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Push account data to an external webhook URL.
   */
  async pushAccountData(
    tenantId: string,
    accountId: string,
    webhookUrl: string,
    options?: { format?: 'json'; includeContacts?: boolean; includeInteractions?: boolean },
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!webhookUrl) throw new BadRequestException('webhookUrl is required');

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
            },
          },
          deals: {
            select: { id: true, name: true, stage: true, amount: true },
          },
          interactions: {
            include: {
              participants: {
                include: {
                  contact: {
                    select: { id: true, email: true, firstName: true, lastName: true, isOptedOut: true },
                  },
                },
              },
            },
            orderBy: { timestamp: 'desc' },
            take: 100,
          },
        },
      });

      if (!account) {
        throw new NotFoundException(`Account ${accountId} not found for tenant ${tenantId}`);
      }

      // Build structured payload
      const payload = {
        _meta: {
          source: 'revenue-data-backbone',
          version: '1.0',
          exportedAt: new Date().toISOString(),
          tenantId,
          type: 'account_sync',
        },
        account: {
          id: account.id,
          name: account.name,
          domain: account.domain,
        },
        contacts: account.contacts.filter((c) => !c.isOptedOut).map((c) => ({
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
        })),
        deals: account.deals,
        interactions: account.interactions.map((i) => ({
          id: i.id,
          type: i.type,
          timestamp: i.timestamp,
          summary: i.summary,
          subject: i.subject,
          direction: i.direction,
          participants: i.participants
            .filter((p) => !p.contact?.isOptedOut)
            .map((p) => ({
              email: p.email,
              role: p.role,
              name: [p.contact?.firstName, p.contact?.lastName].filter(Boolean).join(' ') || null,
            })),
        })),
      };

      // Attempt push with retry
      const result = await this.pushWithRetry(webhookUrl, payload, 3);

      // Log the sync operation
      await tx.exportLog.create({
        data: {
          tenantId,
          scope: 'account',
          scopeId: accountId,
          format: 'json',
          recordCount: account.interactions.length,
          excludedCount: 0,
          redactedCount: 0,
          requestedBy: 'data-cloud-sync',
          filters: { webhookUrl, syncType: 'push' } as any,
        },
      });

      this.logger.log(
        `Data Cloud push: account=${accountId} → ${webhookUrl} (status=${result.status}, interactions=${account.interactions.length})`,
      );

      return {
        success: result.success,
        status: result.status,
        accountId,
        webhookUrl,
        recordsPushed: account.interactions.length,
        contactsPushed: payload.contacts.length,
        dealsPushed: payload.deals.length,
        attempts: result.attempts,
      };
    });
  }

  /**
   * Push all accounts for a tenant to an external endpoint.
   */
  async pushTenantData(tenantId: string, webhookUrl: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    if (!webhookUrl) throw new BadRequestException('webhookUrl is required');

    const accounts: { id: string }[] = await this.prisma.withTenant(tenantId, (tx) =>
      tx.account.findMany({
        where: { tenantId },
        select: { id: true },
      }),
    ) as any;

    const results = await Promise.allSettled(
      accounts.map((a) => this.pushAccountData(tenantId, a.id, webhookUrl)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;

    this.logger.log(`Data Cloud tenant sync: tenant=${tenantId}, accounts=${accounts.length}, succeeded=${succeeded}, failed=${failed}`);

    return {
      success: failed === 0,
      tenantId,
      totalAccounts: accounts.length,
      succeeded,
      failed,
    };
  }

  /**
   * Get sync history for a tenant.
   */
  async getSyncHistory(tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.exportLog.findMany({
        where: {
          tenantId,
          filters: { path: ['syncType'], equals: 'push' },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  }

  private async pushWithRetry(
    url: string,
    payload: Record<string, any>,
    maxAttempts: number,
  ): Promise<{ success: boolean; status: number; attempts: number }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          return { success: true, status: res.status, attempts: attempt };
        }

        this.logger.warn(
          `Data Cloud push attempt ${attempt}/${maxAttempts} failed: ${res.status}`,
        );

        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }

        if (attempt === maxAttempts) {
          return { success: false, status: res.status, attempts: attempt };
        }
      } catch (error) {
        this.logger.error(`Data Cloud push attempt ${attempt}/${maxAttempts} error: ${error.message}`);

        if (attempt === maxAttempts) {
          return { success: false, status: 0, attempts: attempt };
        }

        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }

    return { success: false, status: 0, attempts: maxAttempts };
  }
}
