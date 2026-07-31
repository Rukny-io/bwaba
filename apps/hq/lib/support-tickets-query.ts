import type {
  SupportTicketCategory,
  SupportTicketsListQuery,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/lib/types/support-tickets';
import {
  SUPPORT_TICKET_CATEGORY_OPTIONS,
  SUPPORT_TICKET_PRIORITY_OPTIONS,
} from '@/lib/support-tickets-format';

export const SUPPORT_TICKETS_DEFAULT_LIMIT = 15;

export const SUPPORT_TICKET_STATUS_OPTIONS: {
  value: SupportTicketStatus | '';
  label: string;
}[] = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'WAITING_ON_USER', label: 'Waiting on user' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

export const SUPPORT_TICKET_ASSIGNMENT_OPTIONS = [
  { value: '', label: 'All assignments' },
  { value: 'unassigned', label: 'Unassigned' },
] as const;

export const SUPPORT_TICKET_CATEGORY_FILTER_OPTIONS: {
  value: SupportTicketCategory | '';
  label: string;
}[] = [
  { value: '', label: 'All categories' },
  ...SUPPORT_TICKET_CATEGORY_OPTIONS,
];

export const SUPPORT_TICKET_PRIORITY_FILTER_OPTIONS: {
  value: SupportTicketPriority | '';
  label: string;
}[] = [
  { value: '', label: 'All priorities' },
  ...SUPPORT_TICKET_PRIORITY_OPTIONS,
];

export function parseSupportTicketsQuery(
  params: URLSearchParams,
): Required<Pick<SupportTicketsListQuery, 'page' | 'limit'>> &
  SupportTicketsListQuery {
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const limit = Math.min(
    50,
    Math.max(
      1,
      Number(params.get('limit') || String(SUPPORT_TICKETS_DEFAULT_LIMIT)) ||
        SUPPORT_TICKETS_DEFAULT_LIMIT,
    ),
  );

  const status = params.get('status') as SupportTicketStatus | null;
  const category = params.get('category') as SupportTicketCategory | null;
  const priority = params.get('priority') as SupportTicketPriority | null;
  const search = params.get('search')?.trim() || undefined;
  const assignedTo = params.get('assignedTo') || undefined;

  return {
    page,
    limit,
    status: status || undefined,
    category: category || undefined,
    priority: priority || undefined,
    search,
    assignedTo,
  };
}

export function buildSupportTicketsSearchParams(
  query: SupportTicketsListQuery,
  base?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base?.toString());

  const setOrDelete = (key: string, value?: string | number) => {
    if (value === undefined || value === '' || value === null) {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  };

  setOrDelete('page', query.page && query.page > 1 ? query.page : undefined);
  setOrDelete(
    'limit',
    query.limit && query.limit !== SUPPORT_TICKETS_DEFAULT_LIMIT
      ? query.limit
      : undefined,
  );
  setOrDelete('status', query.status);
  setOrDelete('category', query.category);
  setOrDelete('priority', query.priority);
  setOrDelete('search', query.search);
  setOrDelete('assignedTo', query.assignedTo);

  return params;
}

export function supportTicketsQueryToApiParams(
  query: SupportTicketsListQuery,
): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? SUPPORT_TICKETS_DEFAULT_LIMIT,
    status: query.status || undefined,
    category: query.category || undefined,
    priority: query.priority || undefined,
    search: query.search || undefined,
    assignedTo: query.assignedTo || undefined,
  };
}
