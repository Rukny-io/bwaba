/** Shared types for the account management section */

export interface ManageUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  role?: string;
  profileCompleted?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  isRuknyVerified?: boolean;
  verifiedDisplayName?: string | null;
  verifiedCategory?: string | null;
  ruknyVerifiedAt?: string | null;
  verificationLevel?: number;
  createdAt: string;
  updatedAt: string;
  profile: {
    name: string | null;
    username: string | null;
    avatar: string | null;
    bio?: string | null;
    coverImage?: string | null;
    hidePhone?: boolean;
    hideEmail?: boolean;
  } | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateProfileDetailsPayload {
  username?: string;
  bio?: string;
  name?: string;
  hidePhone?: boolean;
  hideEmail?: boolean;
}

export type ProfileTaskId =
  | "avatar"
  | "name"
  | "username"
  | "bio"
  | "phone";

export interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes?: boolean;
  backupCodesRemaining?: number;
}

export interface LinkedProviderInfo {
  linked: boolean;
  email?: string;
}

export interface LinkedProvidersStatus {
  google: LinkedProviderInfo;
  github: LinkedProviderInfo;
  linkedin: LinkedProviderInfo;
  facebook: LinkedProviderInfo;
  quicksign: { available: boolean; email: string };
  canUnlinkGoogle: boolean;
  canUnlinkGithub: boolean;
  canUnlinkLinkedin: boolean;
  canUnlinkFacebook: boolean;
}

export interface UserSession {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SubscriptionDetails {
  plan: string;
  status: string;
  billingCycle?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelledAt?: string | null;
}

export interface PlanOverview {
  id: string;
  name: string;
  nameEn: string;
  price: { monthly: number; yearly: number };
  limits: Record<string, number | boolean | string>;
}

export interface PlansOverviewResponse {
  plans: PlanOverview[];
}

export interface SubscriptionPayment {
  id: string;
  amount: number;
  billingCycle: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  receiptUrl: string | null;
}

export interface SubscriptionPaymentsResponse {
  payments: SubscriptionPayment[];
}

export interface UsageSummary {
  plan: string;
  usage: Record<string, { used: number; limit: number }>;
}

export interface SecurityLogEntry {
  id: string;
  action: string;
  status: string;
  description: string | null;
  ipAddress: string | null;
  location: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  createdAt: string;
}

export interface SecurityLogsResponse {
  logs: SecurityLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export type IconTone = "green" | "blue" | "purple" | "orange" | "teal" | "red";

export interface DeveloperAppSummary {
  id: string;
  appId: string;
  name: string;
  description: string | null;
  icon: string | null;
  status: string;
  verified: boolean;
  appType: string;
  createdAt: string;
}

export interface AccountSummary {
  twoFactorEnabled: boolean;
  sessionsCount: number;
  linkedMethodsCount: number;
  plan: string;
  emailVerified: boolean;
}

export interface IdentityVerificationStatus {
  verificationLevel: number;
  twoFactorEnabled?: boolean;
  canUpload?: boolean;
  documentTypes?: IdentityDocumentType[];
  requiredDocuments?: {
    primary: string;
    residence: string;
  };
  currentRequest: {
    id: string;
    status: string;
    documentType: string;
    submittedAt: string;
    rejectionReason: string | null;
  } | null;
}

export type IdentityDocumentType =
  | "national_id"
  | "passport"
  | "driving_license";

export type IdentityDocumentSlot =
  | "primary_front"
  | "primary_back"
  | "residence_front"
  | "residence_back";

export interface IdentityUploadSession {
  sessionId: string;
  expiresAt: string;
  maxFileBytes: number;
  allowedMimeTypes: string[];
  presignExpiresIn: number;
}

/** Rukny Verified blue badge */
export type RuknyVerifiedApplicationStatus =
  | "none"
  | "pending"
  | "verified"
  | "rejected";

export type RuknyVerifiedCategory = "personal" | "business" | "creator";

export interface RuknyVerifiedEligibility {
  email: boolean;
  phone: boolean;
  profile: boolean;
  twoFactor: boolean;
  identity: boolean;
  canApply: boolean;
}

export interface RuknyVerifiedStatus {
  status: RuknyVerifiedApplicationStatus;
  verifiedAt?: string | null;
  verifiedCategory?: string | null;
  verifiedDisplayName?: string | null;
  rejectionReason?: string | null;
  canApply?: boolean;
  eligibility?: RuknyVerifiedEligibility;
  application?: {
    id: string;
    category: string;
    displayName: string;
    submittedAt: string;
  } | null;
}

export interface SubmitRuknyVerifiedPayload {
  category: RuknyVerifiedCategory;
  displayName: string;
  publicBio: string;
  websiteUrl?: string;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    website?: string;
  };
}

export type OAuthProvider = "google" | "github" | "linkedin" | "facebook";

export interface ManageNavItem {
  id: string;
  href: string;
  icon: string;
  labelKey: string;
  descKey: string;
}

export interface SecurityNavItem {
  id: string;
  href: string;
  labelKey: string;
  descKey: string;
}

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_ON_USER"
  | "RESOLVED"
  | "CLOSED";

export type SupportTicketCategory =
  | "ACCOUNT"
  | "BILLING"
  | "TECHNICAL"
  | "FEATURE_REQUEST"
  | "OTHER";

export type SupportTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  attachments?: SupportTicketAttachment[];
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

export interface SupportTicketDetail extends SupportTicketSummary {
  messages: SupportTicketMessage[];
  attachments?: SupportTicketAttachment[];
}

export interface SupportTicketsListResponse {
  tickets: SupportTicketSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateSupportTicketPayload {
  subject: string;
  description: string;
  category: SupportTicketCategory;
  context?: Record<string, unknown>;
}
