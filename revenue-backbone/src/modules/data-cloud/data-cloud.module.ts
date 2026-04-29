import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { DataCloudController } from './data-cloud.controller';
import { DataCloudService } from './data-cloud.service';

@Module({
  imports: [PrismaModule],
  controllers: [DataCloudController],
  providers: [DataCloudService],
  exports: [DataCloudService],
})
export class DataCloudModule {}
