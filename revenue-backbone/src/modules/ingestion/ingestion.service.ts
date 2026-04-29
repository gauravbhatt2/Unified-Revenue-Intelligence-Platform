import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { IngestInteractionDto } from './dto/ingest-interaction.dto';
import { NormalizationService } from '../normalization/normalization.service';
import { ResolutionService } from '../resolution/resolution.service';
import { RevenueGraphService } from '../revenue-graph/revenue-graph.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: NormalizationService,
    private readonly resolution: ResolutionService,
    private readonly revenueGraph: RevenueGraphService,
  ) {}

  async ingest(tenantId: string, dto: IngestInteractionDto) {
    // Step 1: Validate tenant exists
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new BadRequestException(`Tenant ${tenantId} not found`);
    }

    return this.prisma.withTenant(tenantId, async (tx) => {
      // Step 2: Store raw interaction
      const rawInteraction = await tx.rawInteraction.create({
        data: {
          tenantId,
          source: dto.source || 'api',
          rawPayload: { ...dto, tenantId } as any,
          status: 'pending',
        },
      });

      this.logger.log(`Raw interaction stored: ${rawInteraction.id}`);

      try {
        // Step 3: Normalize
        const normalized = this.normalization.normalize(dto);

        // Duplicate protection by (tenantId, type, sourceId)
        if (normalized.sourceId) {
          const existing = await tx.interaction.findFirst({
            where: {
              tenantId,
              type: normalized.type,
              sourceId: normalized.sourceId,
            },
            select: { id: true },
          });

          if (existing) {
            await tx.rawInteraction.update({
              where: { id: rawInteraction.id },
              data: {
                status: 'processed',
                processedAt: new Date(),
                errorMsg: `Duplicate interaction skipped; existing interactionId=${existing.id}`,
              },
            });

            this.logger.warn(
              `Duplicate interaction skipped for tenant=${tenantId}, type=${normalized.type}, sourceId=${normalized.sourceId}`,
            );

            return {
              success: true,
              rawInteractionId: rawInteraction.id,
              interactionId: existing.id,
              participantsResolved: 0,
              duplicate: true,
            };
          }
        }

        // Step 4: Resolve contacts
        const resolvedContacts = await this.resolution.resolveParticipants(
          tenantId,
          normalized.participants,
          tx,
        );

        // Step 5: Build revenue graph (store interaction + participants)
        const interaction = await this.revenueGraph.buildGraph({
          tenantId,
          normalized,
          resolvedContacts,
          dealId: dto.dealId,
          tx,
        });

        // Mark raw interaction as processed
        await tx.rawInteraction.update({
          where: { id: rawInteraction.id },
          data: { status: 'processed', processedAt: new Date() },
        });

        this.logger.log(`Interaction processed successfully: ${interaction.id}`);

        return {
          success: true,
          rawInteractionId: rawInteraction.id,
          interactionId: interaction.id,
          participantsResolved: resolvedContacts.length,
        };
      } catch (error) {
        // Mark as failed
        await tx.rawInteraction.update({
          where: { id: rawInteraction.id },
          data: { status: 'failed', errorMsg: error.message },
        });

        this.logger.error(`Ingestion failed for raw interaction ${rawInteraction.id}: ${error.message}`);
        throw error;
      }
    });
  }
}
