import { Module } from '@nestjs/common';
import { HubspotController } from './hubspot.controller';
import { HubspotService } from './hubspot.service';
import { IngestionModule } from '../../ingestion/ingestion.module';

@Module({
  imports: [IngestionModule],
  controllers: [HubspotController],
  providers: [HubspotService],
})
export class HubspotModule {}
