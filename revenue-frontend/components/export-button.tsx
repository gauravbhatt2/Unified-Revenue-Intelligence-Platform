'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { exportAccount, exportAccountCsv } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileJson, FileText } from 'lucide-react';

interface ExportButtonProps {
  tenantId: string;
  accountId: string;
}

export function ExportButton({ tenantId, accountId }: ExportButtonProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (format === 'csv') {
        return { format, ...(await exportAccountCsv(tenantId, accountId)) };
      }
      return { format, data: await exportAccount(tenantId, accountId) };
    },
    onSuccess: (result) => {
      const excluded =
        result.format === 'csv'
          ? result.excludedCount ?? 0
          : result.data.excludedCount ?? 0;
      const redacted =
        result.format === 'csv'
          ? result.redactedCount ?? 0
          : result.data.redactedCount ?? 0;
      const exported =
        result.format === 'csv'
          ? result.totalInteractions ?? 0
          : result.data.totalInteractions ?? 0;

      toast.success(`Exported ${exported} interaction${exported !== 1 ? 's' : ''}`, {
        description:
          excluded > 0
            ? `${excluded} interaction${excluded !== 1 ? 's' : ''} excluded due to compliance (opt-out).`
            : redacted > 0
              ? `${redacted} participant${redacted !== 1 ? 's' : ''} redacted due to compliance mode.`
              : 'All interactions exported. No compliance exclusions.',
        duration: 5000,
      });

      if (result.format === 'json') {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `account-${accountId}-export.json`);
      } else {
        downloadBlob(result.blob, `account-${accountId}-export.csv`);
      }
    },
    onError: (err: Error) => {
      toast.error('Export failed', { description: err.message });
    },
  });

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      {/* Format toggle */}
      <div className="flex rounded-md overflow-hidden">
        <button
          onClick={() => setFormat('json')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
            format === 'json'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileJson className="h-3.5 w-3.5" />
          JSON
        </button>
        <button
          onClick={() => setFormat('csv')}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
            format === 'csv'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          CSV
        </button>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-8 px-3 text-xs"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export
        </Button>
      </motion.div>
    </div>
  );
}
