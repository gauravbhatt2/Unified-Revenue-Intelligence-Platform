'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ingestInteraction } from '@/lib/api';
import type { InteractionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Trash2, Loader2, ChevronUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IngestFormProps {
  tenantId: string;
  accountId: string;
}

interface ParticipantField {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const INTERACTION_TYPES: InteractionType[] = ['email', 'call', 'meeting'];
const ROLES = ['sender', 'recipient', 'attendee'];

export function IngestForm({ tenantId, accountId }: IngestFormProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [type, setType] = useState<InteractionType>('email');
  const [summary, setSummary] = useState('');
  const [subject, setSubject] = useState('');
  const [direction, setDirection] = useState<'inbound' | 'outbound'>('outbound');
  const [participants, setParticipants] = useState<ParticipantField[]>([
    { email: '', firstName: '', lastName: '', role: 'sender' },
  ]);

  const ingestMutation = useMutation({
    mutationFn: () =>
      ingestInteraction({
        tenantId,
        type,
        timestamp: new Date().toISOString(),
        participants: participants
          .filter((p) => p.email.trim())
          .map((p) => ({
            email: p.email.trim(),
            firstName: p.firstName.trim() || undefined,
            lastName: p.lastName.trim() || undefined,
            role: p.role || undefined,
          })),
        summary: summary.trim() || undefined,
        subject: subject.trim() || undefined,
        direction,
        source: 'ui',
      }),
    onSuccess: (data) => {
      toast.success('Interaction ingested', {
        description: `Resolved ${data.participantsResolved} participant${data.participantsResolved !== 1 ? 's' : ''}.`,
      });
      setOpen(false);
      setSummary('');
      setSubject('');
      setParticipants([{ email: '', firstName: '', lastName: '', role: 'sender' }]);
      queryClient.invalidateQueries({ queryKey: ['interactions', tenantId, accountId] });
    },
    onError: (err: Error) => {
      toast.error('Ingestion failed', { description: err.message });
    },
  });

  const addParticipant = () =>
    setParticipants((prev) => [...prev, { email: '', firstName: '', lastName: '', role: 'attendee' }]);

  const removeParticipant = (i: number) =>
    setParticipants((prev) => prev.filter((_, idx) => idx !== i));

  const updateParticipant = (i: number, field: keyof ParticipantField, value: string) =>
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const canSubmit =
    participants.some((p) => p.email.trim()) && !ingestMutation.isPending;

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
        {open ? 'Close' : 'Quick Ingest'}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden mt-3"
          >
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader className="pb-3 pt-4 px-5">
                <p className="text-sm font-semibold text-gray-800">Ingest New Interaction</p>
                <p className="text-xs text-gray-500">Add a test interaction linked to this account</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Type + Direction */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                    <div className="flex gap-1">
                      {INTERACTION_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setType(t)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-colors',
                            type === t
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Direction</label>
                    <div className="flex gap-1">
                      {(['outbound', 'inbound'] as const).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDirection(d)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium border capitalize transition-colors',
                            direction === d
                              ? 'bg-gray-800 text-white border-gray-800'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Q1 Proposal Follow-up"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    placeholder="Brief description of the interaction..."
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none"
                  />
                </div>

                {/* Participants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-600">Participants</label>
                    <button
                      onClick={addParticipant}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {participants.map((p, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input
                          type="email"
                          value={p.email}
                          onChange={(e) => updateParticipant(i, 'email', e.target.value)}
                          placeholder="email@example.com *"
                          className="col-span-4 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={p.firstName}
                          onChange={(e) => updateParticipant(i, 'firstName', e.target.value)}
                          placeholder="First"
                          className="col-span-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <input
                          type="text"
                          value={p.lastName}
                          onChange={(e) => updateParticipant(i, 'lastName', e.target.value)}
                          placeholder="Last"
                          className="col-span-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        <select
                          value={p.role}
                          onChange={(e) => updateParticipant(i, 'role', e.target.value)}
                          className="col-span-3 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeParticipant(i)}
                          disabled={participants.length === 1}
                          className="col-span-1 flex justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  onClick={() => ingestMutation.mutate()}
                  disabled={!canSubmit}
                >
                  {ingestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  Ingest Interaction
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
