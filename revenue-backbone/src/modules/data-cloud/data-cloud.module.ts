import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { DataCloudController } from './data-cloud.controller';
import { DataCloudService } from './data-cloud.service';

import { ComplianceModule } from '../compliance/compliance.module';

@Module({
  imports: [PrismaModule, ComplianceModule],
  controllers: [DataCloudController],
  providers: [DataCloudService],
  exports: [DataCloudService],
})
export class DataCloudModule {}
