import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { RevenueGraphModule } from '../revenue-graph/revenue-graph.module';

@Module({
  imports: [RevenueGraphModule],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
