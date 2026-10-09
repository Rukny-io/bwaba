import { api } from '@/lib/api-client';
import type {
  CreateSupportTicketPayload,
  SupportTicketSummary,
} from '@/lib/api/types';

export async function createSupportTicket(
  payload: CreateSupportTicketPayload,
): Promise<SupportTicketSummary> {
  const { data } = await api.post<SupportTicketSummary>(
    '/support-tickets/me',
    payload,
  );
  return data;
}
