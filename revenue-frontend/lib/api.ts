import type {
  Tenant,
  Account,
  Interaction,
  IngestPayload,
  IngestResponse,
  ExportResponse,
  ComplianceSettings,
  ComplianceExportMode,
  ExportLog,
} from './types';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const USER_ID = 'ui-user';

async function request<T>(path: string, options?: RequestInit, tenantId?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': USER_ID,
  };
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const fetchTenants = (): Promise<Tenant[]> =>
  request('/tenants');

export const createTenant = (data: { name: string; slug: string }): Promise<Tenant> =>
  request('/tenants', { method: 'POST', body: JSON.stringify(data) });

// ─── Accounts ────────────────────────────────────────────────────────────────

export const fetchAccounts = (tenantId: string): Promise<Account[]> =>
  request('/accounts', undefined, tenantId);

export const fetchAccount = (tenantId: string, accountId: string): Promise<Account> =>
  request(`/accounts/${accountId}`, undefined, tenantId);

// ─── Interactions ─────────────────────────────────────────────────────────────

export const fetchAccountInteractions = (
  tenantId: string,
  accountId: string,
): Promise<Interaction[]> =>
  request(`/accounts/${accountId}/interactions`, undefined, tenantId);

// ─── Ingestion ────────────────────────────────────────────────────────────────

export const ingestInteraction = (payload: IngestPayload): Promise<IngestResponse> =>
  request(
    '/ingest',
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        tenantId: undefined,
      }),
    },
    payload.tenantId,
  );

// ─── Compliance ───────────────────────────────────────────────────────────────

export const optOutContact = (tenantId: string, contactId: string, reason?: string) =>
  request(`/contacts/${contactId}/opt-out`, {
    method: 'PATCH',
    body: JSON.stringify(reason ? { reason } : {}),
  }, tenantId);

export const optInContact = (tenantId: string, contactId: string) =>
  request(`/contacts/${contactId}/opt-in`, { method: 'PATCH' }, tenantId);

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportAccount = (
  tenantId: string,
  accountId: string,
): Promise<ExportResponse> =>
  request(`/export/account/${accountId}?format=json`, undefined, tenantId);

export const getAccountExportUrl = (
  tenantId: string,
  accountId: string,
  format: 'json' | 'csv' = 'json',
) =>
  `${BASE_URL}/export/account/${encodeURIComponent(accountId)}?format=${format}`;

export const exportAccountCsv = async (
  tenantId: string,
  accountId: string,
): Promise<{ blob: Blob; totalInteractions: number; excludedCount: number; redactedCount: number }> => {
  const res = await fetch(getAccountExportUrl(tenantId, accountId, 'csv'), {
    headers: { 'x-user-id': USER_ID, 'x-tenant-id': tenantId },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `CSV export failed: ${res.status}`);
  }

  const totalInteractions = Number(res.headers.get('X-Total-Interactions') ?? '0');
  const excludedCount = Number(res.headers.get('X-Excluded-Count') ?? '0');
  const redactedCount = Number(res.headers.get('X-Redacted-Count') ?? '0');
  const blob = await res.blob();

  return { blob, totalInteractions, excludedCount, redactedCount };
};

export const getDealExportUrl = (
  tenantId: string,
  dealId: string,
  format: 'json' | 'csv' = 'json',
) =>
  `${BASE_URL}/export/deal/${encodeURIComponent(dealId)}?format=${format}`;

export const exportDeal = (tenantId: string, dealId: string): Promise<ExportResponse> =>
  request(`/export/deal/${dealId}?format=json`, undefined, tenantId);

export const fetchComplianceSettings = (tenantId: string): Promise<ComplianceSettings> =>
  request('/contacts/compliance/settings', undefined, tenantId);

export const updateComplianceSettings = (
  tenantId: string,
  exportMode: ComplianceExportMode,
): Promise<ComplianceSettings> =>
  request('/contacts/compliance/settings', {
    method: 'PATCH',
    body: JSON.stringify({ exportMode }),
  }, tenantId);

export const fetchExportLogs = (tenantId: string): Promise<ExportLog[]> =>
  request('/export/logs', undefined, tenantId);

export const syncHubspot = (tenantId: string, limit = 20): Promise<{ ingested: number; failed: number }> =>
  request('/connectors/hubspot/sync', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }, tenantId);

export const fetchRawInteractions = (
  tenantId: string,
  status = 'failed',
): Promise<
  { id: string; status: string; errorMsg?: string | null; createdAt: string; processedAt?: string | null }[]
> => request(`/admin/raw-interactions?status=${status}`, undefined, tenantId);

export const retryRawInteraction = (
  tenantId: string,
  rawInteractionId: string,
): Promise<{ retriedRawInteractionId: string }> =>
  request(`/admin/raw-interactions/${rawInteractionId}/retry`, {
    method: 'POST',
  }, tenantId);
