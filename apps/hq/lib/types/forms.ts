export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CLOSED';

export type FormType =
  | 'CONTACT'
  | 'SURVEY'
  | 'REGISTRATION'
  | 'ORDER'
  | 'FEEDBACK'
  | 'QUIZ'
  | 'APPLICATION'
  | 'OTHER';

export interface AdminFormOwner {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  verificationLevel: number;
  isRuknyVerified: boolean;
}

export interface AdminForm {
  id: string;
  title: string;
  slug: string;
  status: FormStatus;
  type: FormType;
  viewCount: number;
  submissionCount: number;
  createdAt: string;
  deletedAt?: string | null;
  purgeScheduledAt?: string | null;
  deletionReason?: string | null;
  owner: AdminFormOwner;
}

export interface FormsListResponse {
  data: AdminForm[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FormsStats {
  total: number;
  published: number;
  draft: number;
  deleted: number;
  totalSubmissions: number;
}

export type FormVisibility = 'active' | 'deleted' | 'all';

export interface FormsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: FormStatus | '';
  visibility?: FormVisibility;
}

export interface AdminFormField {
  id: string;
  label: string;
  type: string;
  order: number;
  required: boolean;
  description: string | null;
}

export interface AdminFormStep {
  id: string;
  title: string;
  order: number;
}

export interface AdminFormIntegration {
  id: string;
  type: string;
  name: string | null;
  isActive: boolean;
  isAutoSync: boolean;
  lastSyncAt: string | null;
  syncedCount: number;
}

export interface AdminFormDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: FormType;
  status: FormStatus;
  coverImage: string | null;
  viewCount: number;
  submissionCount: number;
  allowMultipleSubmissions: boolean;
  requiresAuthentication: boolean;
  oneResponsePerUser: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  shuffleQuestions: boolean;
  maxSubmissions: number | null;
  submissionLimit: number | null;
  opensAt: string | null;
  closesAt: string | null;
  closeAfterDate: boolean;
  notifyOnSubmission: boolean;
  notificationEmail: string | null;
  autoResponseEnabled: boolean;
  isMultiStep: boolean;
  requireTurnstileOnSubmit: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  webhookEvents: string[];
  linkedEvent: { id: string; title: string; slug: string } | null;
  linkedStore: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  purgeScheduledAt: string | null;
  deletionReason: string | null;
  deletedBy: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;
  } | null;
  owner: AdminFormOwner;
  fields: AdminFormField[];
  steps: AdminFormStep[];
  integrations: AdminFormIntegration[];
  counts: {
    fields: number;
    submissions: number;
    integrations: number;
    steps: number;
  };
  deletionLogs: FormDeletionLogEntry[];
}

export interface FormDeletionLogEntry {
  id: string;
  formId: string;
  formTitle: string;
  formSlug: string;
  ownerId: string;
  deletedById: string;
  submissionCount: number;
  fieldCount: number;
  statusAtDelete: FormStatus;
  typeAtDelete: FormType;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  purgeScheduledAt: string;
  restoredAt: string | null;
  purgedAt: string | null;
  createdAt: string;
}

export interface FormDeletionLogsResponse {
  data: FormDeletionLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FormsAnalyticsRankItem {
  formId: string;
  title: string;
  slug: string;
  status: FormStatus;
  ownerEmail: string;
  ownerName: string | null;
  ownerUsername: string | null;
  views: number;
  submissions: number;
  completionRate: number | null;
}

export interface FormsStalePublishedItem {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  createdAt: string;
  daysPublished: number;
  ownerEmail: string;
  ownerName: string | null;
  ownerUsername: string | null;
}

export interface FormsAnalyticsResponse {
  periodDays: number;
  staleDays: number;
  platform: {
    views: number;
    submissions: number;
    completionRate: number | null;
  };
  dailyTrend: { date: string; views: number; submissions: number }[];
  topByViews: FormsAnalyticsRankItem[];
  topBySubmissions: FormsAnalyticsRankItem[];
  stalePublishedNoSubmissions: FormsStalePublishedItem[];
}

export interface FormsExportRow {
  id: string;
  title: string;
  slug: string;
  status: FormStatus;
  type: FormType;
  viewCount: number;
  submissionCount: number;
  ownerEmail: string;
  ownerName: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  purgeScheduledAt: string;
}

export interface FormsExportResponse {
  data: Record<string, unknown>[];
  total: number;
}

export interface FormWebhookDeliveryItem {
  id: string;
  eventId: string;
  status: string;
  attempt: number;
  responseCode: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  webhookUrl: string;
  createdAt: string;
}

export interface FormWebhookHealthResponse {
  formId: string;
  formTitle: string;
  enabled: boolean;
  webhookUrl: string | null;
  webhookEvents: string[];
  periodDays: number;
  stats: {
    totalAttempts: number;
    successCount: number;
    failedCount: number;
    failureRate: number | null;
    successRate: number | null;
    avgLatencyMs: number | null;
  };
  recentDeliveries: FormWebhookDeliveryItem[];
}
