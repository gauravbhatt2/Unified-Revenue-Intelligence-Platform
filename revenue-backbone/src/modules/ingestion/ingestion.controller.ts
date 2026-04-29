import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { IngestionService } from './ingestion.service';
import { IngestInteractionDto } from './dto/ingest-interaction.dto';
import { getRequestAuth } from '../../common/auth/request-auth.util';

@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async ingest(@Req() req: Request, @Body() dto: IngestInteractionDto) {
    const { tenantId } = getRequestAuth(req);
    return this.ingestionService.ingest(tenantId, dto);
  }
}
