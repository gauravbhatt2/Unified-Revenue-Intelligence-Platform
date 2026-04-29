'use client';

import { use, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchAccountInteractions, fetchAccount, fetchAiAccountContext } from '@/lib/api';
import { InteractionCard } from '@/components/interaction-card';
import { InteractionSkeleton } from '@/components/interaction-skeleton';
import { ExportButton } from '@/components/export-button';
import { IngestForm } from '@/components/ingest-form';
import { ComplianceSettings } from '@/components/compliance-settings';
import { ExportLogs } from '@/components/export-logs';
import { HubspotSync } from '@/components/hubspot-sync';
import { DataCloudPush } from '@/components/data-cloud-push';
import { RevenueGraphView } from '@/components/revenue-graph-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getDealExportUrl } from '@/lib/api';
import {
  ArrowLeft,
  Database,
  Building2,
  Globe,
  Activity,
  AlertCircle,
  RefreshCw,
  Brain,
  X,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AccountPage({ params }: PageProps) {
  const { id: accountId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantId = searchParams.get('tenantId') ?? '';
  const [showAiContext, setShowAiContext] = useState(false);

  const { data: aiContext, isLoading: aiContextLoading } = useQuery({
    queryKey: ['ai-context', tenantId, accountId],
    queryFn: () => fetchAiAccountContext(tenantId, accountId),
    enabled: !!tenantId && !!accountId && showAiContext,
  });

  const {
    data: account,
    isLoading: accountLoading,
  } = useQuery({
    queryKey: ['account', tenantId, accountId],
    queryFn: () => fetchAccount(tenantId, accountId),
    enabled: !!tenantId && !!accountId,
  });

  const {
    data: interactions,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['interactions', tenantId, accountId],
    queryFn: () => fetchAccountInteractions(tenantId, accountId),
    enabled: !!tenantId && !!accountId,
  });

  const totalParticipants = interactions?.reduce(
    (sum, i) => sum + i.participants.length, 0,
  ) ?? 0;

  const hasComplianceFlag = interactions?.some((i) =>
    i.participants.some((p) => p.contact?.isOptedOut),
  );

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">Missing tenant context</p>
          <p className="text-sm text-gray-500 mb-4">
            Open this page from the dashboard so it includes a valid `tenantId`.
          </p>
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <span className="text-gray-300">/</span>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-indigo-100 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-indigo-600" />
              </div>
              <span className="font-semibold text-sm text-gray-900">
                {accountLoading ? 'Loading…' : (account?.name ?? 'Account')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tenantId && <HubspotSync tenantId={tenantId} />}
            <button
              onClick={() => setShowAiContext((v) => !v)}
              className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 transition-colors px-2 py-1 rounded-md hover:bg-violet-50"
              title="View AI Context"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>AI Context</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            {tenantId && accountId && (
              <>
                <DataCloudPush tenantId={tenantId} accountId={accountId} />
                <ExportButton tenantId={tenantId} accountId={accountId} />
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* AI Context Panel */}
        <AnimatePresence>
          {showAiContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-600" />
                    <p className="text-sm font-semibold text-violet-900">AI Context Layer</p>
                    <Badge variant="outline" className="text-xs border-violet-200 text-violet-600">Structured Payload</Badge>
                  </div>
                  <button onClick={() => setShowAiContext(false)} className="text-violet-400 hover:text-violet-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-violet-700 mb-3">
                  Pre-assembled context for downstream AI features (summarisation, scoring, next-best-action). Available at <code className="bg-violet-100 px-1 rounded text-[10px]">GET /ai-context/account/{'{id}'}</code>
                </p>
                {aiContextLoading ? (
                  <div className="h-32 bg-violet-100 rounded-lg animate-pulse" />
                ) : aiContext ? (
                  <pre className="bg-white border border-violet-200 rounded-lg p-4 text-xs text-gray-800 overflow-auto max-h-96 font-mono leading-relaxed">
                    {JSON.stringify(aiContext, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-violet-500">No context available.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Account Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              {accountLoading ? (
                <div className="space-y-2">
                  <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {account?.name ?? accountId}
                  </h1>
                  {account?.domain && (
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                      <Globe className="h-3.5 w-3.5" />
                      {account.domain}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasComplianceFlag && (
                <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Compliance Flags
                </Badge>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {isLoading ? '–' : (interactions?.length ?? 0)}
                </p>
                <p className="text-xs text-gray-400">Interactions</p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Database className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {isLoading ? '–' : totalParticipants}
                </p>
                <p className="text-xs text-gray-400">Participants</p>
              </div>
            </div>

            {!isLoading && tenantId && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-xs text-gray-400 font-mono truncate max-w-[200px]" title={tenantId}>
                  Tenant: {tenantId.slice(0, 8)}…
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Ingest Form */}
        {tenantId && accountId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <IngestForm tenantId={tenantId} accountId={accountId} />
          </motion.div>
        )}

        {tenantId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <ComplianceSettings tenantId={tenantId} />
            <ExportLogs tenantId={tenantId} />
          </div>
        )}

        {account?.deals && account.deals.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Deal Exports</p>
            <div className="space-y-1">
              {account.deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{deal.name}</span>
                  <a
                    href={getDealExportUrl(tenantId, deal.id, 'json')}
                    className="text-indigo-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Export JSON
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="mb-6" />

        {!isLoading && account && interactions && interactions.length > 0 && (
          <div className="mb-6">
            <RevenueGraphView account={account} interactions={interactions} />
          </div>
        )}

        {/* Interaction List */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <InteractionSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Failed to load interactions</p>
            <p className="text-sm text-gray-500 mb-4">
              {(error as Error)?.message ?? 'Something went wrong'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </motion.div>
        ) : interactions?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">No interactions yet</p>
            <p className="text-sm text-gray-400">
              Use the Quick Ingest button above to add the first interaction.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {interactions!.length} interaction{interactions!.length !== 1 ? 's' : ''} found
            </p>
            {interactions!.map((interaction, i) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                tenantId={tenantId}
                accountId={accountId}
                index={i}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
