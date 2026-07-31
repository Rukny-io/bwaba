import type {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/lib/types/support-tickets';

export function formatTicketStatus(status: SupportTicketStatus): string {
  const labels: Record<SupportTicketStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In progress',
    WAITING_ON_USER: 'Waiting on user',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };
  return labels[status];
}

export function formatTicketCategory(category: SupportTicketCategory): string {
  const labels: Record<SupportTicketCategory, string> = {
    ACCOUNT: 'Account',
    BILLING: 'Billing',
    TECHNICAL: 'Technical',
    FEATURE_REQUEST: 'Feature request',
    OTHER: 'Other',
  };
  return labels[category];
}

export const SUPPORT_TICKET_CATEGORY_OPTIONS: {
  value: SupportTicketCategory;
  label: string;
}[] = [
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'FEATURE_REQUEST', label: 'Feature request' },
  { value: 'OTHER', label: 'Other' },
];

export function formatTicketPriority(priority: SupportTicketPriority): string {
  const labels: Record<SupportTicketPriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };
  return labels[priority];
}

export function ticketStatusChipColor(
  status: SupportTicketStatus,
): 'default' | 'success' | 'warning' | 'danger' | 'accent' {
  switch (status) {
    case 'OPEN':
      return 'accent';
    case 'IN_PROGRESS':
      return 'warning';
    case 'WAITING_ON_USER':
      return 'default';
    case 'RESOLVED':
      return 'success';
    case 'CLOSED':
      return 'default';
    default:
      return 'default';
  }
}

export const SUPPORT_TICKET_PRIORITY_OPTIONS: {
  value: SupportTicketPriority;
  label: string;
}[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export function ticketPriorityChipColor(
  priority: SupportTicketPriority,
): 'default' | 'success' | 'warning' | 'danger' | 'accent' {
  switch (priority) {
    case 'URGENT':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'accent';
    case 'LOW':
      return 'default';
    default:
      return 'default';
  }
}

const TICKET_STATUS_HINTS: Record<SupportTicketStatus, string> = {
  OPEN: 'New ticket awaiting staff response',
  IN_PROGRESS: 'Staff is actively working on this ticket',
  WAITING_ON_USER: 'Awaiting a reply from the customer',
  RESOLVED: 'Issue resolved — ticket may be closed',
  CLOSED: 'Ticket is closed',
};

const TICKET_PRIORITY_HINTS: Record<SupportTicketPriority, string> = {
  LOW: 'Low priority — handle when capacity allows',
  MEDIUM: 'Standard priority',
  HIGH: 'High priority — respond soon',
  URGENT: 'Urgent — requires immediate attention',
};

export function ticketStatusHint(status: SupportTicketStatus): string {
  return TICKET_STATUS_HINTS[status] ?? formatTicketStatus(status);
}

export function ticketPriorityHint(priority: SupportTicketPriority): string {
  return TICKET_PRIORITY_HINTS[priority] ?? formatTicketPriority(priority);
}

export function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatTicketDateTime(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
