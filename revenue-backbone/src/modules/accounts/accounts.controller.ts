import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AccountsService } from './accounts.service';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.accountsService.findAll(tenantId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.accountsService.findById(tenantId, id);
  }

  @Get(':id/interactions')
  getInteractions(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.accountsService.getInteractions(tenantId, id);
  }
}
