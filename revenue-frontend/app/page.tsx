'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchTenants, createTenant } from '@/lib/api';
import { AccountSelection } from '@/components/account-selection';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Database className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-900">Revenue Data Backbone</span>
          </div>
          <Badge variant="secondary" className="text-xs">POC v1.0</Badge>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-700 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Multi-tenant · Compliance-ready · Deterministic
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Revenue Data Backbone
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            A unified system for ingesting, normalizing, and querying revenue interactions
            across accounts, contacts, and deals.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              whileHover={{ y: -2 }}
            >
              <Card className="border-gray-200 shadow-sm h-full">
                <CardContent className="pt-5 pb-5">
                  <div className={`h-9 w-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}>
                    <f.icon className={`h-4.5 w-4.5 ${f.color}`} />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Search Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="border-gray-200 shadow-sm max-w-2xl mx-auto">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">View Account Interactions</p>
                <p className="text-xs text-gray-500">Select a tenant, then choose an account to open its interaction graph.</p>
              </div>

              {/* Tenant selector */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Tenant</label>
                {tenantsLoading ? (
                  <div className="h-9 bg-gray-100 rounded-md animate-pulse" />
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={tenantInput}
                      onChange={(e) => setTenantInput(e.target.value)}
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="">— Select tenant or paste ID —</option>
                      {tenants?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.slug})
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs shrink-0"
                      onClick={() => setShowCreateTenant((v) => !v)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Button>
                  </div>
                )}

                {/* Manual paste fallback */}
                <input
                  type="text"
                  value={tenantInput}
                  onChange={(e) => setTenantInput(e.target.value)}
                  placeholder="…or paste Tenant ID directly"
                  className="mt-2 w-full rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {/* Create tenant inline */}
              {showCreateTenant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-indigo-800">Create New Tenant</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      placeholder="Name (e.g. Acme Corp)"
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <input
                      type="text"
                      value={newTenantSlug}
                      onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="Slug (e.g. acme-corp)"
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs"
                    onClick={() => createTenantMutation.mutate()}
                    disabled={!newTenantName.trim() || !newTenantSlug.trim() || createTenantMutation.isPending}
                  >
                    {createTenantMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Building2 className="h-3.5 w-3.5" />
                    )}
                    Create Tenant
                  </Button>
                </motion.div>
              )}

              {/* Account selection */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Account</label>
                <AccountSelection
                  tenantId={tenantInput.trim()}
                  onSelect={(account) =>
                    router.push(`/account/${account.id}?tenantId=${tenantInput.trim()}`)
                  }
                />
                {tenantInput.trim() && (
                  <div className="mt-2 text-right">
                    <Link
                      className="text-xs text-indigo-600 hover:underline"
                      href={`/admin?tenantId=${tenantInput.trim()}`}
                    >
                      Open admin operations
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tenants quick list */}
        {tenants && tenants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Existing Tenants
            </p>
            <div className="space-y-2">
              {tenants.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-2.5 text-sm hover:border-indigo-200 transition-colors cursor-pointer group"
                  onClick={() => setTenantInput(t.id)}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="font-medium text-gray-700">{t.name}</span>
                    <Badge variant="outline" className="text-xs">{t.slug}</Badge>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
