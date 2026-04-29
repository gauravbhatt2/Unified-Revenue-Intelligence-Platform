import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IngestionService } from '../../ingestion/ingestion.service';
import { IngestInteractionDto } from '../../ingestion/dto/ingest-interaction.dto';

type HubspotObjectType = 'emails' | 'calls' | 'meetings';

@Injectable()
export class HubspotService {
  private readonly logger = new Logger(HubspotService.name);

  constructor(private readonly ingestionService: IngestionService) {}

  async syncLatest(tenantId: string, limit = 20) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      throw new BadRequestException('HUBSPOT_ACCESS_TOKEN is not configured');
    }

    const [emails, calls, meetings] = await Promise.all([
      this.fetchObjects(token, 'emails', limit),
      this.fetchObjects(token, 'calls', limit),
      this.fetchObjects(token, 'meetings', limit),
    ]);

    const candidates = [
      ...emails.map((e: any) => this.mapRecordToIngest('email', e)),
      ...calls.map((c: any) => this.mapRecordToIngest('call', c)),
      ...meetings.map((m: any) => this.mapRecordToIngest('meeting', m)),
    ].filter((x): x is IngestInteractionDto => Boolean(x));

    const results = await Promise.allSettled(
      candidates.map((dto) => this.ingestionService.ingest(tenantId, dto)),
    );
    const ingested = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ingested;

    return {
      success: true,
      source: 'hubspot',
      ingested,
      failed,
      totalFetched: candidates.length,
    };
  }

  async ingestWebhookEvents(tenantId: string, events: Record<string, any>[]) {
    if (!tenantId) throw new BadRequestException('tenantId is required');

    const candidates = events
      .map((event) => this.mapWebhookEventToIngest(event))
      .filter((x): x is IngestInteractionDto => Boolean(x));

    const results = await Promise.allSettled(
      candidates.map((dto) => this.ingestionService.ingest(tenantId, dto)),
    );
    const ingested = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ingested;

    return {
      success: true,
      source: 'hubspot-webhook',
      ingested,
      failed,
      totalReceived: events.length,
      totalMapped: candidates.length,
    };
  }

  private async fetchObjects(
    token: string,
    type: HubspotObjectType,
    limit: number,
  ): Promise<Record<string, any>[]> {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${type}?limit=${limit}&archived=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new BadRequestException(`HubSpot ${type} fetch failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as { results?: Record<string, any>[] };
    return data.results || [];
  }

  private mapRecordToIngest(
    type: 'email' | 'call' | 'meeting',
    record: Record<string, any>,
  ): IngestInteractionDto | null {
    const p = record.properties || {};
    const timestamp = p.hs_timestamp || p.hs_createdate || p.createdate || record.createdAt;
    if (!timestamp) return null;

    const participants = this.extractParticipants(p);
    if (participants.length === 0) return null;

    return {
      type,
      timestamp: new Date(timestamp).toISOString(),
      participants,
      summary: p.hs_call_body || p.hs_meeting_body || p.hs_email_text || p.hs_body_preview || undefined,
      subject: p.hs_email_subject || p.hs_call_title || p.hs_meeting_title || undefined,
      direction: this.mapDirection(p.hs_email_direction || p.hs_call_direction),
      source: 'hubspot',
      sourceId: record.id || p.hs_object_id,
    };
  }

  private mapWebhookEventToIngest(event: Record<string, any>): IngestInteractionDto | null {
    const interactionType = this.mapWebhookType(event.subscriptionType);
    if (!interactionType) return null;

    const timestamp = event.occurredAt || event.timestamp || Date.now();
    const email = event.email || event.userEmail || event.ownerEmail;
    if (!email) return null;

    return {
      type: interactionType,
      timestamp: new Date(timestamp).toISOString(),
      participants: [{ email: String(email).toLowerCase(), role: 'attendee' }],
      summary: `HubSpot webhook event: ${event.subscriptionType || 'unknown'}`,
      source: 'hubspot-webhook',
      sourceId: String(event.eventId || event.objectId || `${event.subscriptionType}-${timestamp}`),
    };
  }

  private extractParticipants(properties: Record<string, any>) {
    const keys = [
      'hs_email_from_email',
      'hs_email_to_email',
      'hs_email_cc_email',
      'hs_email_bcc_email',
      'hs_owner_email',
    ];

    const emails = new Set<string>();
    for (const key of keys) {
      const raw = properties[key];
      if (!raw) continue;
      const chunks = String(raw)
        .split(/[;,]/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      for (const email of chunks) emails.add(email);
    }

    return [...emails].map((email, index) => ({
      email,
      role: index === 0 ? 'sender' : 'recipient',
    }));
  }

  private mapDirection(raw?: string): 'inbound' | 'outbound' | undefined {
    if (!raw) return undefined;
    const v = String(raw).toLowerCase();
    if (v.includes('in')) return 'inbound';
    if (v.includes('out')) return 'outbound';
    return undefined;
  }

  private mapWebhookType(subscriptionType?: string): 'email' | 'call' | 'meeting' | null {
    if (!subscriptionType) return null;
    const v = subscriptionType.toLowerCase();
    if (v.includes('email')) return 'email';
    if (v.includes('call')) return 'call';
    if (v.includes('meeting')) return 'meeting';
    this.logger.debug(`Ignored HubSpot event type: ${subscriptionType}`);
    return null;
  }
}
