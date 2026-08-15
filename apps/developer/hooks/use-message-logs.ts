'use client';

import { useQuery } from '@tanstack/react-query';
import { getMessageLogs } from '@/lib/api/usage';

export const messageLogsKeys = {
  all: ['message-logs'] as const,
  list: (filters: Record<string, string | number | undefined>) =>
    [...messageLogsKeys.all, filters] as const,
};

export function useMessageLogs(filters?: {
  status?: string;
  direction?: string;
  page?: number;
  phoneId?: string;
}) {
  return useQuery({
    queryKey: messageLogsKeys.list(filters ?? {}),
    queryFn: () => getMessageLogs({ ...filters, limit: 20 }),
  });
}
