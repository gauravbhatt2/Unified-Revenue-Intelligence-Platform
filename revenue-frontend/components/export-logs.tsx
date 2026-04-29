'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchExportLogs } from '@/lib/api';

export function ExportLogs({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['export-logs', tenantId],
    queryFn: () => fetchExportLogs(tenantId),
    enabled: Boolean(tenantId),
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">Recent Export Audit Logs</p>
      {isLoading ? (
        <p className="text-xs text-gray-500">Loading logs...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-xs text-gray-500">No export logs yet.</p>
      ) : (
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left py-1">Time</th>
                <th className="text-left py-1">Scope</th>
                <th className="text-left py-1">Fmt</th>
                <th className="text-right py-1">Records</th>
                <th className="text-right py-1">Excluded</th>
                <th className="text-right py-1">Redacted</th>
              </tr>
            </thead>
            <tbody>
              {data.map((log) => (
                <tr key={log.id} className="border-t border-gray-100">
                  <td className="py-1">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-1">{log.scope}</td>
                  <td className="py-1">{log.format}</td>
                  <td className="py-1 text-right">{log.recordCount}</td>
                  <td className="py-1 text-right">{log.excludedCount}</td>
                  <td className="py-1 text-right">{log.redactedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
