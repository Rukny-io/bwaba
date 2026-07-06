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
  } | null;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  avatar?: string;
}

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
  linkedin: LinkedProviderInfo;
  facebook: LinkedProviderInfo;
  quicksign: { available: boolean; email: string };
  canUnlinkGoogle: boolean;
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

export type OAuthProvider = "google" | "linkedin" | "facebook";

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
