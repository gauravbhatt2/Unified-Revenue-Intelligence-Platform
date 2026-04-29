'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRawInteractions, retryRawInteraction, fetchExportLogs } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  History, 
  FileText,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function AdminContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantId = searchParams.get('tenantId') || '';
  const [activeTab, setActiveTab] = useState<'ingestion' | 'exports'>('ingestion');

  const { data: rawInteractions, isLoading: ingestLoading } = useQuery({
    queryKey: ['raw-interactions', tenantId],
    queryFn: () => fetchRawInteractions(tenantId, 'failed'),
    enabled: Boolean(tenantId),
  });

  const { data: exportLogs, isLoading: exportLoading } = useQuery({
    queryKey: ['export-logs', tenantId],
    queryFn: () => fetchExportLogs(tenantId),
    enabled: Boolean(tenantId),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryRawInteraction(tenantId, id),
    onSuccess: () => {
      toast.success('Retry sequence initiated');
      queryClient.invalidateQueries({ queryKey: ['raw-interactions', tenantId] });
    },
    onError: (error: Error) => {
      toast.error('Retry failed', { description: error.message });
    },
  });

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-gray-500 mb-6">Select a tenant on the dashboard to access administrative logs.</p>
            <Button onClick={() => router.push('/')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Governance & Operations</h1>
            </div>
          </div>
          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-mono">
            {tenantId.slice(0, 8)}...
          </Badge>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 mt-8">
        <div className="flex gap-1 mb-8 bg-slate-200/50 p-1 rounded-lg w-fit">
          <Button 
            variant={activeTab === 'ingestion' ? 'white' : 'ghost'} 
            size="sm" 
            className={cn("px-6", activeTab === 'ingestion' ? "shadow-sm" : "text-slate-500")}
            onClick={() => setActiveTab('ingestion')}
          >
            <Activity className="h-3.5 w-3.5 mr-2" />
            Ingestion Pipeline
          </Button>
          <Button 
            variant={activeTab === 'exports' ? 'white' : 'ghost'} 
            size="sm" 
            className={cn("px-6", activeTab === 'exports' ? "shadow-sm" : "text-slate-500")}
            onClick={() => setActiveTab('exports')}
          >
            <History className="h-3.5 w-3.5 mr-2" />
            Export Audit Logs
          </Button>
        </div>

        {activeTab === 'ingestion' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Failed Ingestions</h2>
                <p className="text-sm text-slate-500">Raw records that failed to resolve during contextual mapping.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-interactions'] })}
                className="bg-white"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
            </div>

            {ingestLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />)}
              </div>
            ) : !rawInteractions || rawInteractions.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-200 bg-transparent shadow-none">
                <CardContent className="py-20 text-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Pipeline Clear</p>
                  <p className="text-xs text-slate-400">All raw interactions have been successfully processed.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {rawInteractions.map((item) => (
                  <Card key={item.id} className="border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-colors">
                    <CardContent className="p-0">
                      <div className="p-4 flex items-start justify-between bg-white">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-900 uppercase">Ingestion Failure</span>
                              <Badge variant="outline" className="text-[10px] uppercase">{item.source || 'api'}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mb-2">{item.id}</p>
                            <p className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded inline-block">
                              Error: {item.errorMsg || 'Deterministic resolution failed'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-3">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </span>
                          <Button
                            size="sm"
                            variant="indigo"
                            className="h-8 px-4 text-xs font-bold shadow-indigo-100 shadow-md"
                            onClick={() => retryMutation.mutate(item.id)}
                            disabled={retryMutation.isPending}
                          >
                            {retryMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Retry Resolution"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
             <div>
                <h2 className="text-xl font-bold text-slate-900">Audit History</h2>
                <p className="text-sm text-slate-500">Immutable trail of all data exports and cloud sync operations.</p>
              </div>

              {exportLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-slate-200 rounded-xl animate-pulse" />)}
                </div>
              ) : !exportLogs || exportLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-400">No exports logged.</div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Timestamp</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Scope</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Format</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Records</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exportLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <span className="font-medium text-slate-900 uppercase">{log.scope}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-mono">{log.format}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {log.status === 'success' ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase">
                                <CheckCircle2 className="h-3 w-3" /> Succeeded
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase">
                                <XCircle className="h-3 w-3" /> Failed
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                             <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-900">{log.recordCount}</span>
                                {log.excludedCount > 0 && (
                                  <span className="text-[10px] text-orange-500 font-medium">-{log.excludedCount} compliance</span>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-12 text-slate-400 text-center">Initialising Admin View...</div>}>
      <AdminContent />
    </Suspense>
  );
}

