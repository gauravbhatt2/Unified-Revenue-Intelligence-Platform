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

    const contacts = await this.fetchContacts(token, limit);

    const candidates = contacts
      .map((c: any) => this.mapContactToIngest(c))
      .filter((x): x is IngestInteractionDto => Boolean(x));

    const results = await Promise.allSettled(
      candidates.map((dto) => this.ingestionService.ingest(tenantId, dto)),
    );
    const ingested = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ingested;

    this.logger.log(`HubSpot sync: Fetched ${contacts.length} contacts, ingested ${ingested}`);

    return {
      success: true,
      source: 'hubspot',
      ingested,
      failed,
      totalFetched: contacts.length,
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

  private async fetchContacts(
    token: string,
    limit: number,
  ): Promise<Record<string, any>[]> {
    const res = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname&archived=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new BadRequestException(`HubSpot contacts fetch failed: ${res.status} ${body}`);
    }

    const data = (await res.json()) as { results?: Record<string, any>[] };
    return data.results || [];
  }

  private mapContactToIngest(
    record: Record<string, any>,
  ): IngestInteractionDto | null {
    const p = record.properties || {};
    if (!p.email) return null;

    const timestamp = p.createdate || record.createdAt || new Date().toISOString();

    return {
      type: 'email',
      timestamp: new Date(timestamp).toISOString(),
      participants: [
        {
          email: p.email.toLowerCase(),
          firstName: p.firstname || undefined,
          lastName: p.lastname || undefined,
          role: 'receiver',
        },
      ],
      summary: 'HubSpot contact sync',
      source: 'hubspot',
      sourceId: record.id,
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
