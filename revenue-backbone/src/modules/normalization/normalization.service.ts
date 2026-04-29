import { Injectable, BadRequestException } from '@nestjs/common';
import { IngestInteractionDto } from '../ingestion/dto/ingest-interaction.dto';
import { NormalizedInteraction } from './normalized-interaction.interface';

const VALID_TYPES = ['email', 'call', 'meeting'];

@Injectable()
export class NormalizationService {
  normalize(raw: IngestInteractionDto): NormalizedInteraction {
    const type = raw.type?.toLowerCase();
    if (!VALID_TYPES.includes(type)) {
      throw new BadRequestException(`Invalid interaction type: ${raw.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
    }

    if (!raw.participants || raw.participants.length === 0) {
      throw new BadRequestException('At least one participant is required');
    }

    const participants = raw.participants.map((p) => ({
      email: p.email.toLowerCase().trim(),
      firstName: p.firstName?.trim(),
      lastName: p.lastName?.trim(),
      role: p.role,
    }));

    // Deduplicate by email
    const seen = new Set<string>();
    const uniqueParticipants = participants.filter((p) => {
      if (seen.has(p.email)) return false;
      seen.add(p.email);
      return true;
    });

    return {
      type,
      timestamp: new Date(raw.timestamp),
      summary: raw.summary?.trim(),
      subject: raw.subject?.trim(),
      direction: raw.direction,
      sourceId: raw.sourceId,
      participants: uniqueParticipants,
    };
  }
}
