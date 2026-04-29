'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncHubspotCompanies } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Building2, Loader2 } from 'lucide-react';

export function HubspotCompaniesSync({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const syncMutation = useMutation({
    mutationFn: () => syncHubspotCompanies(tenantId),
    onSuccess: (res) => {
      toast.success(`Companies synced: ${res.created} created, ${res.updated} updated`);
      queryClient.invalidateQueries({ queryKey: ['accounts', tenantId] });
    },
    onError: (error: Error) => {
      toast.error('Companies sync failed', { description: error.message });
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
      ) : (
        <Building2 className="h-3.5 w-3.5 mr-1" />
      )}
      Sync Companies
    </Button>
  );
}
