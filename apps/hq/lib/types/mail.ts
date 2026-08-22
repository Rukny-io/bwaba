export type MailAppStatus = 'ACTIVE' | 'ARCHIVED';
export type MailAppType = 'BUSINESS' | 'CONSUMER';
export type MailDomainStatus =
  | 'NONE'
  | 'PENDING_DNS'
  | 'VERIFYING'
  | 'ACTIVE'
  | 'FAILED';
export type MailPlanCode = 'STARTER' | 'STANDARD' | 'PREMIUM';
export type MailMailboxStatus = 'ACTIVE' | 'DISABLED';
export type MailMessageDirection = 'INBOUND' | 'OUTBOUND';
export type MailMessageStatus = 'QUEUED' | 'SENT' | 'FAILED' | 'RECEIVED';

export type MailWorkspaceTab =
  | 'analytics'
  | 'domains'
  | 'review'
  | 'delivery'
  | 'alerts';

export interface AdminMailOwner {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  verificationLevel: number;
  isRuknyVerified: boolean;
}

export interface AdminMailSubscriptionSummary {
  plan: MailPlanCode;
  status: string;
  mailboxCount: number;
}

export interface AdminMailApp {
  id: string;
  appId: string;
  name: string;
  appType: MailAppType | string;
  status: MailAppStatus;
  primaryDomain: string | null;
  domainStatus: MailDomainStatus;
  domainCheckedAt: string | null;
  createdAt: string;
  mailboxCount: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  owner: AdminMailOwner;
  subscription: AdminMailSubscriptionSummary | null;
}

export interface MailAppsListResponse {
  data: AdminMailApp[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MailAppsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: MailAppStatus | '';
  plan?: MailPlanCode | 'none' | '';
  domainStatus?: MailDomainStatus | '';
  tab?: MailWorkspaceTab;
}

export interface MailStats {
  apps: { total: number; active: number; archived: number };
  mailboxes: { total: number; active: number; disabled: number };
  messages: {
    inbound7d: number;
    outbound7d: number;
    inbound30d: number;
    outbound30d: number;
    failed7d: number;
    failed24h: number;
    queued: number;
  };
  plans: {
    STARTER: number;
    STANDARD: number;
    PREMIUM: number;
    none: number;
  };
  domains: Record<MailDomainStatus, number>;
  storage: { usedBytes: number; quotaBytes: number };
}

export interface MailAnalyticsMailboxRow {
  address: string;
  inbound: number;
  outbound: number;
  failed: number;
}

export interface MailAnalyticsResponse {
  days: number;
  appId?: string;
  dailyTrend: Array<{
    date: string;
    inbound: number;
    outbound: number;
    failed: number;
  }>;
  plans: Array<{ plan: MailPlanCode; count: number }>;
  domains: Array<{ status: MailDomainStatus; count: number }>;
  mailboxes?: MailAnalyticsMailboxRow[];
}

export interface MailAlertApp {
  appId: string;
  name: string;
  primaryDomain: string | null;
  domainStatus?: MailDomainStatus;
  contactEmail?: string | null;
  owner?: AdminMailOwner;
}

export interface MailDeliveryItem {
  id: string;
  mailboxId: string;
  direction: MailMessageDirection | string;
  folder: string;
  status: MailMessageStatus | string;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  sesMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  mailboxAddress: string | null;
  appId: string | null;
  appName: string | null;
}

export interface MailDeliveryListResponse {
  data: MailDeliveryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  days: number;
}

export interface MailDomainsResponse {
  counts: Record<MailDomainStatus, number>;
  apps: Array<{
    appId: string;
    name: string;
    status: MailAppStatus;
    primaryDomain: string | null;
    domainStatus: MailDomainStatus;
    domainCheckedAt: string | null;
    owner: AdminMailOwner;
  }>;
}

export interface MailAlertsResponse {
  noSubscription: Array<MailAlertApp & { type: 'no_subscription' }>;
  storageHigh: Array<
    MailAlertApp & {
      type: 'storage_high';
      usedBytes: number;
      quotaBytes: number;
      percent: number;
    }
  >;
  deliveryFailed24h: Array<{
    type: 'delivery_failed_24h';
    appId: string;
    name: string;
    primaryDomain: string | null;
    count: number;
  }>;
  domainUnverified: Array<MailAlertApp & { type: 'domain_unverified' }>;
  planTickets: Array<{
    type: 'plan_ticket';
    ticketId: string;
    number: string;
    subject: string;
    status: string;
    createdAt: string;
    mailAppId: string | null;
    mailAppName: string | null;
  }>;
}

export interface AdminMailMailbox {
  id: string;
  localPart: string;
  domain: string;
  address: string;
  displayName: string | null;
  status: MailMailboxStatus | 'DELETED' | string;
  totpEnabled: boolean;
  hasPassword?: boolean;
  storageUsedBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMailAppDetail extends AdminMailApp {
  contactEmail: string | null;
  description: string | null;
  slotIndex: number;
  userId: string;
  updatedAt: string;
  subscription: {
    plan: MailPlanCode;
    status: string;
    mailboxCount: number;
    billingCycle: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  storage: { usedBytes: number; quotaBytes: number; mailboxCount: number };
  counts: { mailboxes: number; failed24h: number };
  sesRefreshAvailable: boolean;
  recentFailures: MailDeliveryItem[];
}

export interface MailAppsExportResponse {
  data: Array<Record<string, string | number>>;
  total: number;
}

export interface MailDomainRefreshResponse {
  refreshed: boolean;
  sesAvailable: boolean;
  primaryDomain: string | null;
  domainStatus: MailDomainStatus;
  domainCheckedAt: string | null;
  ses?: { found: boolean; sending: boolean; dkim: string };
}
