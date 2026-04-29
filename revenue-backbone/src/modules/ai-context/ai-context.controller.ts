import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AiContextService } from './ai-context.service';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('ai-context')
export class AiContextController {
  constructor(private readonly aiContextService: AiContextService) {}

  @Get('account/:accountId')
  getAccountContext(@Param('accountId') accountId: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.aiContextService.getAccountContext(tenantId, accountId);
  }

  @Get('contact/:contactId')
  getContactContext(@Param('contactId') contactId: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.aiContextService.getContactContext(tenantId, contactId);
  }
}
