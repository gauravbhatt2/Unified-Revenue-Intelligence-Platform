import { Module } from '@nestjs/common';
import { RevenueGraphService } from './revenue-graph.service';

@Module({
  providers: [RevenueGraphService],
  exports: [RevenueGraphService],
})
export class RevenueGraphModule {}
