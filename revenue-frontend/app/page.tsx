'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchTenants, createTenant, fetchAccounts } from '@/lib/api';
import { AccountSelection } from '@/components/account-selection';
import { IngestForm } from '@/components/ingest-form';
import { HubspotCompaniesSync } from '@/components/hubspot-companies-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Shield,
  BarChart3,
  Plus,
  Loader2,
  Building2,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Database,
    title: 'Interaction Ingestion',
    desc: 'Ingest emails, calls, and meetings from any source into a unified graph.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Compliance Enforced',
    desc: 'Opt-out contacts are automatically excluded at export time — no manual review.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: BarChart3,
    title: 'Revenue Graph',
    desc: 'Every interaction is linked to contacts, accounts, and deals via a relational graph.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [tenantInput, setTenantInput] = useState('');
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');

  const { data: tenants, isLoading: tenantsLoading, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: fetchTenants,
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', tenantInput],
    queryFn: () => fetchAccounts(tenantInput.trim()),
    enabled: Boolean(tenantInput.trim()),
  });

  const createTenantMutation = useMutation({
    mutationFn: () => createTenant({ name: newTenantName.trim(), slug: newTenantSlug.trim() }),
    onSuccess: (t) => {
      toast.success(`Tenant "${t.name}" created`);
      setTenantInput(t.id);
      setShowCreateTenant(false);
      setNewTenantName('');
      setNewTenantSlug('');
      refetch();
    },
    onError: (err: Error) => {
      toast.error('Failed to create tenant', { description: err.message });
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Database className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">Revenue Data Backbone</span>
            <Badge variant="secondary" className="text-xs ml-2">POC v1.0</Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {tenantsLoading ? (
              <div className="h-9 w-64 bg-gray-100 rounded-md animate-pulse" />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                <span className="text-xs font-medium text-gray-500 pl-2">Tenant:</span>
                <select
                  value={tenantInput}
                  onChange={(e) => setTenantInput(e.target.value)}
                  className="rounded-md border-none bg-transparent px-2 py-1.5 text-sm font-semibold text-gray-800 focus:ring-0 cursor-pointer min-w-[180px]"
                >
                  <option value="" disabled>Select tenant...</option>
                  {tenants?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setShowCreateTenant((v) => !v)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Create tenant inline */}
        {showCreateTenant && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
              <CardContent className="p-5 flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-indigo-900 mb-1.5 block">Tenant Name</label>
                  <input
                    type="text"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-indigo-900 mb-1.5 block">Tenant Slug</label>
                  <input
                    type="text"
                    value={newTenantSlug}
                    onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="e.g. acme-corp"
                    className="w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => createTenantMutation.mutate()}
                  disabled={!newTenantName.trim() || !newTenantSlug.trim() || createTenantMutation.isPending}
                >
                  {createTenantMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Building2 className="h-4 w-4 mr-2" />
                  )}
                  Create Tenant
                </Button>
                <Button variant="ghost" onClick={() => setShowCreateTenant(false)}>Cancel</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!tenantInput ? (
          /* Landing state when no tenant is selected */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white shadow-sm border border-gray-100 mb-6">
              <Building2 className="h-8 w-8 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Revenue Data Backbone</h1>
            <p className="text-lg text-gray-500 max-w-lg mx-auto mb-8">
              Select a tenant from the top navigation to view accounts and interaction data, or create a new one to get started.
            </p>
          </motion.div>
        ) : (
          /* Tenant Dashboard */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Header row for active tenant */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-500 mt-1">Manage accounts and interactions for this tenant.</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin?tenantId=${tenantInput}`} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
                  <Shield className="h-4 w-4" />
                  Admin Logs
                </Link>
                <HubspotCompaniesSync tenantId={tenantInput} />
                {accounts && accounts.length > 0 && (
                  <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                    <IngestForm tenantId={tenantInput} buttonLabel="Quick Ingest" />
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            {accountsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-xl border border-gray-100 shadow-sm animate-pulse" />
                ))}
              </div>
            ) : accounts && accounts.length === 0 ? (
              /* CRITICAL: Empty State with Ingest Form */
              <Card className="border-2 border-dashed border-indigo-100 bg-white/50 shadow-none overflow-hidden">
                <CardContent className="py-16 px-6 text-center">
                  <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                    <BarChart3 className="h-8 w-8 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No data yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8 text-base">
                    Add your first interaction to get started. We will automatically resolve contacts and create the corresponding account.
                  </p>
                  <div className="flex justify-center max-w-2xl mx-auto text-left shadow-lg rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <IngestForm tenantId={tenantInput} buttonLabel="Add First Interaction" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Accounts Grid */
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {accounts?.map((account, idx) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      className="group cursor-pointer"
                      onClick={() => router.push(`/account/${account.id}?tenantId=${tenantInput}`)}
                    >
                      <Card className="h-full border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
                        <CardContent className="p-5 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                              <Building2 className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
                          </div>
                          
                          <div className="mt-auto">
                            <h3 className="font-bold text-lg text-gray-900 truncate mb-1" title={account.name}>
                              {account.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 gap-2">
                              <span className="truncate">{account.domain}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                              <span className="font-medium text-indigo-600 shrink-0">
                                {account._count?.interactions || 0} interactions
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
