'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ParticipantRow } from '@/components/participant-row';
import type { Interaction } from '@/lib/types';
import { Mail, Phone, CalendarDays, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractionCardProps {
  interaction: Interaction;
  tenantId: string;
  accountId: string;
  index: number;
}

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-600', bg: 'bg-blue-50' },
  call: { icon: Phone, label: 'Call', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  meeting: { icon: CalendarDays, label: 'Meeting', color: 'text-violet-600', bg: 'bg-violet-50' },
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function InteractionCard({ interaction, tenantId, accountId, index }: InteractionCardProps) {
  const config = typeConfig[interaction.type] ?? typeConfig.email;
  const Icon = config.icon;
  const { date, time } = formatTimestamp(interaction.timestamp);
  const hasOptedOut = interaction.participants.some((p) => p.contact?.isOptedOut);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Card className={cn(
        'border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
        hasOptedOut && 'border-orange-200 bg-orange-50/30',
      )}>
        {/* Colored top accent strip */}
        <div className={cn('h-1 w-full', {
          'bg-blue-400': interaction.type === 'email',
          'bg-emerald-400': interaction.type === 'call',
          'bg-violet-400': interaction.type === 'meeting',
        })} />

        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', config.bg)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {interaction.subject || config.label}
                  </span>
                  {hasOptedOut && (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600 bg-orange-50">
                      Compliance Flag
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{date}</span>
                  <span>·</span>
                  <span>{time}</span>
                  {interaction.direction && (
                    <>
                      <span>·</span>
                      {interaction.direction === 'outbound' ? (
                        <span className="flex items-center gap-0.5 text-blue-500">
                          <ArrowUpRight className="h-3 w-3" /> Outbound
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-emerald-500">
                          <ArrowDownLeft className="h-3 w-3" /> Inbound
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <Badge
              variant="secondary"
              className={cn('text-xs shrink-0', config.color, config.bg, 'border-0')}
            >
              {config.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 space-y-4">
          {interaction.summary && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
              {interaction.summary}
            </p>
          )}

          {interaction.participants.length > 0 && (
            <div>
              <Separator className="mb-3" />
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Participants ({interaction.participants.length})
              </p>
              <div className="space-y-2">
                {interaction.participants.map((p) => (
                  <ParticipantRow
                    key={p.id}
                    participant={p}
                    tenantId={tenantId}
                    accountId={accountId}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
