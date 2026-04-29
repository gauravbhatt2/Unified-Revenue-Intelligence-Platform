import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { IngestInteractionDto } from '../ingestion/dto/ingest-interaction.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ingestionService: IngestionService,
  ) {}

  async listRawInteractions(tenantId: string, status?: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    return this.prisma.withTenant(tenantId, (tx) =>
      tx.rawInteraction.findMany({
        where: {
          tenantId,
          ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    );
  }

  async retryRawInteraction(tenantId: string, rawInteractionId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const raw: any = await this.prisma.withTenant(tenantId, (tx) =>
      tx.rawInteraction.findFirst({
        where: { id: rawInteractionId, tenantId },
      }),
    );
    if (!raw) throw new NotFoundException(`Raw interaction ${rawInteractionId} not found`);

    const payload = raw.rawPayload as unknown as IngestInteractionDto;
    if (!payload?.participants || !payload?.timestamp) {
      throw new BadRequestException('Raw payload is not retryable by current ingestion contract');
    }

    const result = await this.ingestionService.ingest(tenantId, payload);
    return { retriedRawInteractionId: rawInteractionId, result };
  }
}
