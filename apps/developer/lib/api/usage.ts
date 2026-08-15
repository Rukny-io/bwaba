import { api } from '@/lib/api-client';
import type { MessageLogsPage } from '@/lib/api/types';

export async function getMessageLogs(params?: {
  status?: string;
  direction?: string;
  type?: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  phoneId?: string;
}): Promise<MessageLogsPage> {
  const { data } = await api.get<MessageLogsPage>(
    '/developer/usage/messages',
    params,
  );
  return data;
}
