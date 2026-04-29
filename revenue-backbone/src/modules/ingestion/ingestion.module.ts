import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { NormalizationModule } from '../normalization/normalization.module';
import { ResolutionModule } from '../resolution/resolution.module';
import { RevenueGraphModule } from '../revenue-graph/revenue-graph.module';

@Module({
  imports: [NormalizationModule, ResolutionModule, RevenueGraphModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
