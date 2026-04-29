'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pushAccountToCloud } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { CloudUpload, Loader2 } from 'lucide-react';

interface DataCloudPushProps {
  tenantId: string;
  accountId: string;
}

export function DataCloudPush({ tenantId, accountId }: DataCloudPushProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/mock-url');

  const pushMutation = useMutation({
    mutationFn: () => pushAccountToCloud(tenantId, accountId, webhookUrl),
    onSuccess: (res) => {
      toast.success(`Data Cloud Push complete`, {
        description: `${res.recordsPushed} interactions synced. Status: ${res.status}`,
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error('Data Cloud push failed', { description: error.message });
    },
  });

  if (!isOpen) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
        onClick={() => setIsOpen(true)}
      >
        <CloudUpload className="h-3.5 w-3.5 mr-1" />
        Data Cloud
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-indigo-50 p-1 rounded-md border border-indigo-200">
      <input
        type="text"
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
        placeholder="Webhook URL"
        className="text-xs px-2 py-1 rounded border-indigo-200 w-48"
      />
      <Button
        size="sm"
        className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
        onClick={() => pushMutation.mutate()}
        disabled={pushMutation.isPending || !webhookUrl}
      >
        {pushMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : 'Push'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-indigo-700"
        onClick={() => setIsOpen(false)}
      >
        Cancel
      </Button>
    </div>
  );
}
