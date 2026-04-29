'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '@/lib/api';
import type { Account } from '@/lib/types';
import { Building2, ChevronRight, Globe } from 'lucide-react';

interface AccountSelectionProps {
  tenantId: string;
  onSelect: (account: Account) => void;
}

export function AccountSelection({ tenantId, onSelect }: AccountSelectionProps) {
  const {
    data: accounts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['accounts', tenantId],
    queryFn: () => fetchAccounts(tenantId),
    enabled: Boolean(tenantId),
  });

  if (!tenantId) {
    return (
      <p className="text-xs text-gray-500">
        Select a tenant to load accounts.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-red-500">
        Failed to load accounts: {(error as Error)?.message ?? 'Unknown error'}
      </p>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        No accounts found - use ingest to create data.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {accounts.map((account, index) => (
        <motion.button
          key={account.id}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          whileHover={{ y: -1 }}
          onClick={() => onSelect(account)}
          className="w-full rounded-lg border border-gray-100 bg-white px-4 py-3 text-left transition-colors hover:border-indigo-200 group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm font-medium text-gray-800 truncate">
                  {account.name}
                </p>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 truncate">
                <Globe className="h-3 w-3" />
                {account.domain}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </div>
        </motion.button>
      ))}
    </div>
  );
}
