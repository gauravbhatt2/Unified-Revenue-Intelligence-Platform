import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { NormalizationModule } from './modules/normalization/normalization.module';
import { ResolutionModule } from './modules/resolution/resolution.module';
import { RevenueGraphModule } from './modules/revenue-graph/revenue-graph.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { ExportModule } from './modules/export/export.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { HubspotModule } from './modules/connectors/hubspot/hubspot.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiContextModule } from './modules/ai-context/ai-context.module';
import { DataCloudModule } from './modules/data-cloud/data-cloud.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    TenantModule,
    NormalizationModule,
    ResolutionModule,
    RevenueGraphModule,
    IngestionModule,
    ComplianceModule,
    ExportModule,
    AccountsModule,
    HubspotModule,
    AdminModule,
    AiContextModule,
    DataCloudModule,
  ],
})
export class AppModule {}
