'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { optOutContact, optInContact } from '@/lib/api';
import type { Participant } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, UserX, UserCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ParticipantRowProps {
  participant: Participant;
  tenantId: string;
  accountId: string;
}

export function ParticipantRow({ participant, tenantId, accountId }: ParticipantRowProps) {
  const queryClient = useQueryClient();
  const [localOptedOut, setLocalOptedOut] = useState(participant.contact?.isOptedOut ?? false);

  const optOutMutation = useMutation({
    mutationFn: () => optOutContact(tenantId, participant.contactId, 'user requested opt-out'),
    onSuccess: () => {
      setLocalOptedOut(true);
      toast.warning(`${participant.email} opted out`, {
        description: 'This contact will be excluded from future exports.',
      });
      queryClient.invalidateQueries({ queryKey: ['interactions', tenantId, accountId] });
    },
    onError: (err: Error) => {
      toast.error('Opt-out failed', { description: err.message });
    },
  });

  const optInMutation = useMutation({
    mutationFn: () => optInContact(tenantId, participant.contactId),
    onSuccess: () => {
      setLocalOptedOut(false);
      toast.success(`${participant.email} opted back in`);
      queryClient.invalidateQueries({ queryKey: ['interactions', tenantId, accountId] });
    },
    onError: (err: Error) => {
      toast.error('Opt-in failed', { description: err.message });
    },
  });

  const isPending = optOutMutation.isPending || optInMutation.isPending;
  const fullName = [participant.contact?.firstName, participant.contact?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      layout
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
        localOptedOut ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          localOptedOut ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-indigo-500',
        )}>
          <User className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          {fullName && (
            <p className="font-medium text-gray-900 truncate leading-tight">{fullName}</p>
          )}
          <div className="flex items-center gap-1 text-gray-500">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{participant.email}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 shrink-0">
        {participant.role && (
          <Badge variant="outline" className="text-xs capitalize hidden sm:flex">
            {participant.role}
          </Badge>
        )}

        <AnimatePresence mode="wait">
          {localOptedOut ? (
            <motion.div
              key="opted-out"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                onClick={() => optInMutation.mutate()}
                disabled={isPending}
              >
                <UserCheck className="h-3 w-3" />
                Opted Out
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="opt-out"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1"
                onClick={() => optOutMutation.mutate()}
                disabled={isPending}
              >
                <UserX className="h-3 w-3" />
                Opt Out
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
