import { Controller, Patch, Param, Body, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { UpdateComplianceSettingsDto } from './dto/update-compliance-settings.dto';
import { OptOutContactDto } from './dto/opt-out-contact.dto';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('contacts')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Patch(':id/opt-out')
  optOut(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: OptOutContactDto,
  ) {
    const { tenantId } = getRequestAuth(req);
    return this.complianceService.optOut(tenantId, id, body.reason);
  }

  @Patch(':id/opt-in')
  optIn(@Param('id') id: string, @Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.complianceService.optIn(tenantId, id);
  }

  @Get('compliance/settings')
  getSettings(@Req() req: Request) {
    const { tenantId } = getRequestAuth(req);
    return this.complianceService.getSettings(tenantId);
  }

  @Patch('compliance/settings')
  updateSettings(
    @Req() req: Request,
    @Body() dto: UpdateComplianceSettingsDto,
  ) {
    const { tenantId } = getRequestAuth(req);
    return this.complianceService.updateSettings(tenantId, dto.exportMode);
  }
}
