export type DeveloperAppType = 'BUSINESS' | 'CONSUMER';

export type DeveloperAppStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export type VerificationItemStatus = 'complete' | 'pending' | 'missing';

export interface VerificationItem {
  status: VerificationItemStatus;
  missingRequirements: string[];
}

export interface AppVerificationSummary {
  businessVerification: VerificationItem;
  accessVerification: VerificationItem;
  canSubmitAccessReview: boolean;
}

export interface DeveloperApp {
  id: string;
  appId: string;
  name: string;
  contactEmail: string;
  companyEmail?: string | null;
  appType: DeveloperAppType;
  description?: string | null;
  businessId?: string | null;
  icon?: string | null;
  profileImage?: string | null;
  websiteUrl?: string | null;
  termsOfUseUrl?: string | null;
  privacyPolicyUrl?: string | null;
  dpoName?: string | null;
  dpoEmail?: string | null;
  dpoPhone?: string | null;
  status: DeveloperAppStatus;
  verified: boolean;
  accessVerified?: boolean;
  accessReviewRequestedAt?: string | null;
  verification?: AppVerificationSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppInput {
  name: string;
  contactEmail: string;
  appType: DeveloperAppType;
  description?: string;
  businessId?: string;
  icon?: string;
  otpCode: string;
}

export interface UpdateAppInput {
  name?: string;
  description?: string;
  contactEmail?: string;
  companyEmail?: string;
  businessId?: string;
  icon?: string;
  profileImage?: string;
  websiteUrl?: string;
  termsOfUseUrl?: string;
  privacyPolicyUrl?: string;
  dpoName?: string;
  dpoEmail?: string;
  dpoPhone?: string;
}

export type AppImageUploadType = 'icon' | 'profile';

export interface PresignFileInfo {
  name: string;
  type: string;
  size: number;
}

export interface PresignUploadResult {
  key: string;
  url: string;
}

export interface SendAppOtpInput {
  phoneNumber: string;
}

export interface SendAppOtpResponse {
  sent: boolean;
  expiresInSeconds: number;
}

export interface VerifyAppOtpInput {
  phoneNumber: string;
  code: string;
}

export interface VerifyAppOtpResponse {
  verified: boolean;
}

export const APP_ID_PATTERN = /^\d{16}$/;

export function isValidAppId(appId: string): boolean {
  return APP_ID_PATTERN.test(appId);
}

export function isValidPhoneId(phoneId: string): boolean {
  return APP_ID_PATTERN.test(phoneId);
}

export type ApiKeyStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type ApiKeyEnvironment = 'live' | 'test';

export interface DeveloperApiKey {
  id: string;
  slug: string;
  name: string;
  keyPrefix: string;
  keySuffix: string;
  scopes: string[];
  environment: string;
  status: ApiKeyStatus;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  ipAllowlist: string[];
  requestCount: number | string;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
  developerAppId: string;
  scopes?: string[];
  environment?: ApiKeyEnvironment;
  ipAllowlist?: string[];
  expiresAt?: string;
}

export interface UpdateApiKeyInput {
  name?: string;
  scopes?: string[];
  ipAllowlist?: string[];
}

export interface CreatedApiKeyResponse extends DeveloperApiKey {
  key: string;
}

export interface DeveloperSubscription {
  plan: string;
  effectivePlan?: string;
  platformPlan?: string | null;
  billingModel?: 'usage';
  apiKeysUsed: number;
  apiKeysLimit: number;
  appsUsed?: number;
  appsLimit?: number;
}

export interface AppWallet {
  id: string;
  appId: string;
  appName: string;
  balance: number;
  currency: string;
  totalAllocated: number;
  totalSpent: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterWallet {
  id: string;
  balance: number;
  currency: string;
  autoRechargeEnabled: boolean;
  autoRechargeAmount?: number | null;
  autoRechargeThreshold?: number | null;
  lowBalanceAlert?: number | null;
  totalTopUps: number;
  totalSpent: number;
}

export interface AllocateWalletResult {
  success: boolean;
  amount: number;
  masterBalance: number;
  appBalance: number;
}

export interface WhatsappAccountSummary {
  id: string;
  status: string;
  wabaId?: string;
  verifiedName?: string;
  businessName?: string | null;
  connectedAt?: string | null;
  phoneNumbers?: WhatsappPhoneSummary[];
}

export interface WhatsappPhoneSummary {
  id: string;
  phoneId: string;
  phoneNumber: string;
  phoneNumberId: string;
  displayPhoneNumber?: string | null;
  verifiedName?: string | null;
  qualityRating?: string | null;
  messagingLimit?: string | null;
  status: string;
  account?: {
    id: string;
    businessName?: string | null;
    wabaId: string;
  };
}

export interface WhatsappTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  accountId: string;
  components?: unknown;
  lastSyncedAt?: string | null;
}

export interface EmbeddedSignupConfig {
  appId: string;
  configId: string;
}

export interface MessageLogEntry {
  id: string;
  direction: string;
  messageType: string;
  status: string;
  recipientNumber?: string | null;
  senderNumber?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
}

export interface MessageLogsPage {
  data: MessageLogEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ContactsPage {
  data: DeveloperContact[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface DeveloperWebhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  description?: string | null;
  failureCount: number;
  createdAt: string;
  lastTriggeredAt?: string | null;
}

export interface DeveloperWebhookCreated extends DeveloperWebhook {
  secret: string;
}

export interface DeveloperContact {
  id: string;
  name: string;
  phoneNumber: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
