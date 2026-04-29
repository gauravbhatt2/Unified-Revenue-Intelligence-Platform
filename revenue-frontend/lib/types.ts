export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface Account {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  createdAt: string;
  _count?: { contacts: number; interactions: number };
  deals?: { id: string; name: string; stage?: string | null; amount?: number | null }[];
}

export interface Contact {
  id: string;
  tenantId: string;
  accountId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isOptedOut: boolean;
  optOutReason: string | null;
  optedOutAt: string | null;
}

export interface Participant {
  id: string;
  tenantId: string;
  interactionId: string;
  contactId: string;
  email: string;
  role: string | null;
  contact: Pick<Contact, 'id' | 'email' | 'firstName' | 'lastName' | 'isOptedOut' | 'accountId' | 'optedOutAt' | 'optOutReason'>;
}

export type InteractionType = 'email' | 'call' | 'meeting';

export interface Interaction {
  id: string;
  tenantId: string;
  accountId: string | null;
  dealId: string | null;
  type: InteractionType;
  timestamp: string;
  summary: string | null;
  subject: string | null;
  direction: string | null;
  participants: Participant[];
}

export interface IngestPayload {
  tenantId: string;
  type: InteractionType;
  timestamp: string;
  participants: { email: string; firstName?: string; lastName?: string; role?: string }[];
  summary?: string;
  subject?: string;
  direction?: 'inbound' | 'outbound';
  dealId?: string;
  source?: string;
}

export interface IngestResponse {
  success: boolean;
  rawInteractionId: string;
  interactionId: string;
  participantsResolved: number;
  duplicate?: boolean;
}

export interface ExportResponse {
  account?: { id: string; name: string; domain: string };
  deal?: { id: string; name: string };
  totalInteractions: number;
  excludedCount: number;
  redactedCount: number;
  interactions: Interaction[];
}

export type ComplianceExportMode = 'EXCLUDE_INTERACTION' | 'REDACT_PARTICIPANT';

export interface ComplianceSettings {
  id: string;
  tenantId: string;
  exportMode: ComplianceExportMode;
}

export interface ExportLog {
  id: string;
  tenantId: string;
  scope: 'account' | 'deal';
  scopeId: string;
  format: 'json' | 'csv';
  recordCount: number;
  excludedCount: number;
  redactedCount: number;
  requestedBy?: string | null;
  status: 'success' | 'failed' | null;
  attempts: number;
  errorMsg?: string | null;
  createdAt: string;
}
