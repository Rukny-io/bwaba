export type IdentityVerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export type IdentityDocumentSlot =
  | 'primary_front'
  | 'primary_back'
  | 'residence_front'
  | 'residence_back'
  | 'selfie';

export interface IdentityDocumentsFlags {
  primary_front: boolean;
  primary_back: boolean;
  residence_front: boolean;
  residence_back: boolean;
  selfie: boolean;
}

export interface UserIdentityRequest {
  id: string;
  documentType: string;
  status: IdentityVerificationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  documentsDeletedAt: string | null;
  documentsPurgeAt: string | null;
  documents: IdentityDocumentsFlags | null;
}

export interface UserRuknyVerifiedApplication {
  id: string;
  category: string;
  displayName: string;
  publicBio: string;
  websiteUrl: string | null;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface UserVerificationSummary {
  verificationLevel: number;
  isRuknyVerified: boolean;
  ruknyVerifiedAt: string | null;
  verifiedCategory: string | null;
  verifiedDisplayName: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface UserVerificationResponse {
  user: UserVerificationSummary;
  identityRequests: UserIdentityRequest[];
  ruknyApplications: UserRuknyVerifiedApplication[];
}

export interface IdentityDocumentViewResponse {
  url: string;
  expiresIn: number;
  slot: IdentityDocumentSlot;
}

export interface UserLockoutStatus {
  email: string;
  isLocked: boolean;
  lockoutUntil: string | null;
  lockCount: number;
  recentAttempts: number;
  lastAttempt: string | null;
}
