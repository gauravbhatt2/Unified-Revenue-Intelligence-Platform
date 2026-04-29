'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchComplianceSettings, updateComplianceSettings } from '@/lib/api';
import type { ComplianceExportMode } from '@/lib/types';
import { toast } from 'sonner';

export function ComplianceSettings({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['compliance-settings', tenantId],
    queryFn: () => fetchComplianceSettings(tenantId),
    enabled: Boolean(tenantId),
  });

  const mutation = useMutation({
    mutationFn: (mode: ComplianceExportMode) => updateComplianceSettings(tenantId, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-settings', tenantId] });
      toast.success('Compliance export mode updated');
    },
    onError: (error: Error) => toast.error('Failed to update compliance setting', { description: error.message }),
  });

  const value = data?.exportMode || 'EXCLUDE_INTERACTION';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-gray-700 mb-2">Compliance Export Mode</p>
      <select
        value={value}
        onChange={(e) => mutation.mutate(e.target.value as ComplianceExportMode)}
        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs"
        disabled={mutation.isPending}
      >
        <option value="EXCLUDE_INTERACTION">Exclude interaction when any participant is opted out</option>
        <option value="REDACT_PARTICIPANT">Keep interaction and redact opted-out participant</option>
      </select>
    </div>
  );
}
