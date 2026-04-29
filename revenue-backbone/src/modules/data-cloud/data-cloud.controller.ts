import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { DataCloudService } from './data-cloud.service';
import { getRequestAuth } from '../../common/auth/request-auth.util';

import { IsUrl } from 'class-validator';

class PushAccountDto {
  @IsUrl({ require_tld: false })
  webhookUrl: string;
}

class PushTenantDto {
  @IsUrl({ require_tld: false })
  webhookUrl: string;
}

@Controller('data-cloud')
export class DataCloudController {
  constructor(private readonly dataCloudService: DataCloudService) {}

  /**
   * Push a single account's data to an external webhook.
   */
  @Post('push/account/:accountId')
  pushAccount(
    @Param('accountId') accountId: string,
    @Body() dto: PushAccountDto,
    @Req() req: Request,
  ) {
    const { tenantId } = getRequestAuth(req);
    return this.dataCloudService.pushAccountData(tenantId, accountId, dto.webhookUrl);
  }

  /**
   * Push all tenant data to an external webhook.
   */
  @Post('push/tenant')
  pushTenant(@Body() dto: PushTenantDto, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.dataCloudService.pushTenantData(tenantId, dto.webhookUrl);
  }

  /**
   * Get sync history for the tenant.
   */
  @Get('history')
  getSyncHistory(@Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.dataCloudService.getSyncHistory(tenantId);
  }
}
