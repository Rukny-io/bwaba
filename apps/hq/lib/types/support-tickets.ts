export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_USER'
  | 'RESOLVED'
  | 'CLOSED';

export type SupportTicketCategory =
  | 'ACCOUNT'
  | 'BILLING'
  | 'TECHNICAL'
  | 'FEATURE_REQUEST'
  | 'OTHER';

export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicketSummary {
  id: string;
  number: string;
  subject: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messageCount?: number;
  userId?: string;
  userEmail?: string;
}

export interface SupportTicketAttachment {
  id: string;
  ticketId: string;
  messageId: string | null;
  uploadedById: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaff: boolean;
  isInternal?: boolean;
  createdAt: string;
  attachments?: SupportTicketAttachment[];
}

export interface AdminSupportTicketDetail extends SupportTicketSummary {
  userId: string;
  userEmail: string;
  description: string;
  context: Record<string, unknown> | null;
  messages: SupportTicketMessage[];
  attachments?: SupportTicketAttachment[];
}

export interface SupportTicketsListQuery {
  page?: number;
  limit?: number;
  status?: SupportTicketStatus;
  search?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  assignedTo?: string;
}

export interface SupportTicketsStats {
  open: number;
  inProgress: number;
  waitingOnUser: number;
  urgent: number;
  unassigned: number;
  totalActive: number;
}

export interface SupportTicketsListResponse {
  tickets: SupportTicketSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UpdateSupportTicketStatusPayload {
  status: SupportTicketStatus;
  priority?: SupportTicketPriority;
}

export type SupportCannedResponseCategory =
  | 'GREETING'
  | 'INFO_REQUEST'
  | 'RESOLUTION'
  | 'CLOSING'
  | 'BILLING'
  | 'FOLLOW_UP';

export interface SupportCannedResponse {
  id: string;
  category: SupportCannedResponseCategory;
  title: string;
  body: string;
  locale: 'en' | 'ar';
}
