'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncHubspot } from '@/lib/api';
import { Button } from '@/components/ui/button';

export function HubspotSync({ tenantId }: { tenantId: string }) {
  const syncMutation = useMutation({
    mutationFn: () => syncHubspot(tenantId, 20),
    onSuccess: (res) => {
      toast.success(`HubSpot sync complete: ${res.ingested} ingested, ${res.failed} failed`);
    },
    onError: (error: Error) => {
      toast.error('HubSpot sync failed', { description: error.message });
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs"
      onClick={() => syncMutation.mutate()}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? 'Syncing...' : 'Sync HubSpot'}
    </Button>
  );
}
