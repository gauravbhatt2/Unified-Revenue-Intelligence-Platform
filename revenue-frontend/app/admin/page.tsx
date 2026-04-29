'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRawInteractions, retryRawInteraction } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function AdminContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['raw-interactions', tenantId],
    queryFn: () => fetchRawInteractions(tenantId, 'failed'),
    enabled: Boolean(tenantId),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => retryRawInteraction(tenantId, id),
    onSuccess: () => {
      toast.success('Retry triggered');
      queryClient.invalidateQueries({ queryKey: ['raw-interactions', tenantId] });
    },
    onError: (error: Error) => {
      toast.error('Retry failed', { description: error.message });
    },
  });

  if (!tenantId) {
    return <div className="p-6 text-sm text-gray-600">Pass `tenantId` in query params.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin Operations</h1>
      <p className="text-xs text-gray-500">Failed raw interactions for tenant: {tenantId}</p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading failed records...</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-500">No failed raw interactions.</p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div key={item.id} className="rounded border border-gray-200 p-3">
              <p className="text-xs text-gray-700">ID: {item.id}</p>
              <p className="text-xs text-gray-500">Error: {item.errorMsg || 'Unknown error'}</p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => retryMutation.mutate(item.id)}
                disabled={retryMutation.isPending}
              >
                Retry
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading admin page...</div>}>
      <AdminContent />
    </Suspense>
  );
}
