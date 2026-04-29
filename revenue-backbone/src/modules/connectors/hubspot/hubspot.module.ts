import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma.module';
import { HubspotController } from './hubspot.controller';
import { HubspotService } from './hubspot.service';
import { HubspotScheduler } from './hubspot.scheduler';
import { IngestionModule } from '../../ingestion/ingestion.module';

@Module({
  imports: [IngestionModule, PrismaModule],
  controllers: [HubspotController],
  providers: [HubspotService, HubspotScheduler],
  exports: [HubspotService],
})
export class HubspotModule {}
