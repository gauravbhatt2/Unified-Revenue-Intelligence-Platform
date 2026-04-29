import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma.service';
import { HubspotService } from './hubspot.service';

/**
 * Scheduled cron job for HubSpot sync.
 * Runs every 30 minutes for all tenants that have a configured HubSpot token.
 *
 * In production, per-tenant tokens would be stored in a secure vault.
 * For now, the global HUBSPOT_ACCESS_TOKEN env var is used.
 */
@Injectable()
export class HubspotScheduler {
  private readonly logger = new Logger(HubspotScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hubspotService: HubspotService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleScheduledSync() {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      this.logger.debug('Scheduled HubSpot sync skipped — HUBSPOT_ACCESS_TOKEN not set');
      return;
    }

    this.logger.log('Scheduled HubSpot sync started');

    // Fetch all tenants
    const tenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });

    for (const tenant of tenants) {
      try {
        const result = await this.hubspotService.syncLatest(tenant.id, 50);
        this.logger.log(
          `Scheduled sync for tenant "${tenant.name}": created=${result.created}, updated=${result.updated}, failed=${result.failed}`,
        );
      } catch (error) {
        this.logger.error(
          `Scheduled sync failed for tenant "${tenant.name}": ${error.message}`,
        );
      }
    }

    this.logger.log('Scheduled HubSpot sync completed');
  }
}
