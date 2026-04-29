import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('raw-interactions')
  listRawInteractions(
    @Req() req: Request,
    @Query('status') status?: string,
  ) {
    const { tenantId } = getRequestAuth(req);
    return this.adminService.listRawInteractions(tenantId, status);
  }

  @Post('raw-interactions/:id/retry')
  retryRawInteraction(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.adminService.retryRawInteraction(tenantId, id);
  }
}
