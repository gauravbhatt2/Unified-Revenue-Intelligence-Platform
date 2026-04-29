import { IsIn } from 'class-validator';
import { ComplianceExportMode } from '@prisma/client';

export class UpdateComplianceSettingsDto {
  @IsIn([ComplianceExportMode.EXCLUDE_INTERACTION, ComplianceExportMode.REDACT_PARTICIPANT])
  exportMode: ComplianceExportMode;
}
