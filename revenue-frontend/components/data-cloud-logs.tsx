'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSyncHistory } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DataCloudLogs({ tenantId }: { tenantId: string }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['data-cloud-history', tenantId],
    queryFn: () => fetchSyncHistory(tenantId),
    enabled: !!tenantId,
  });

  return (
    <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-indigo-500" />
          Data Cloud Sync History
        </h3>
      </div>
      <CardContent className="p-0 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No Data Cloud syncs have been triggered yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log: any) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 uppercase">
                      {log.scope} {log.scopeId ? log.scopeId.slice(0,8) : 'sync'}
                    </span>
                    <span className="text-xs text-gray-500">
                      • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span className="font-mono bg-gray-100 px-1 rounded">{log.format}</span>
                    <span>Records: {log.recordCount}</span>
                    {log.excludedCount > 0 && (
                      <span className="text-orange-600 font-medium bg-orange-50 px-1 rounded">Excluded: {log.excludedCount}</span>
                    )}
                  </div>
                </div>
                {log.status === 'failed' && (
                  <button className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
