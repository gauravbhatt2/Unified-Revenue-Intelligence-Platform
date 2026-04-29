import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { HubspotService } from './hubspot.service';
import { HubspotSyncDto } from './dto/hubspot-sync.dto';
import { HubspotWebhookDto } from './dto/hubspot-webhook.dto';
import { getRequestAuth } from '../../../common/auth/request-auth.util';

@Controller('connectors/hubspot')
export class HubspotController {
  constructor(private readonly hubspotService: HubspotService) {}

  @Post('sync')
  sync(@Req() req: Request, @Body() dto: HubspotSyncDto) {
    const { tenantId } = getRequestAuth(req);
    return this.hubspotService.syncLatest(tenantId, dto.limit ?? 20);
  }

  @Post('webhook')
  webhook(@Req() req: Request, @Body() dto: HubspotWebhookDto) {
    const { tenantId } = getRequestAuth(req);
    return this.hubspotService.ingestWebhookEvents(tenantId, dto.events || []);
  }
}
