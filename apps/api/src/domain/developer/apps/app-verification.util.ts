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

type AppVerificationInput = {
  businessId?: string | null;
  verified: boolean;
  accessVerified: boolean;
  accessReviewRequestedAt?: Date | null;
  websiteUrl?: string | null;
  termsOfUseUrl?: string | null;
  privacyPolicyUrl?: string | null;
  dpoName?: string | null;
  dpoEmail?: string | null;
  icon?: string | null;
  profileImage?: string | null;
  name: string;
};

function hasLegalLinks(app: AppVerificationInput): string[] {
  const missing: string[] = [];
  if (!app.websiteUrl?.trim()) missing.push('website');
  if (!app.termsOfUseUrl?.trim()) missing.push('termsOfUse');
  if (!app.privacyPolicyUrl?.trim()) missing.push('privacyPolicy');
  return missing;
}

function hasIdentity(app: AppVerificationInput): string[] {
  const missing: string[] = [];
  if (!app.name?.trim()) missing.push('name');
  if (!app.icon?.trim()) missing.push('icon');
  if (!app.profileImage?.trim()) missing.push('profileImage');
  return missing;
}

function hasDpo(app: AppVerificationInput): string[] {
  const missing: string[] = [];
  if (!app.dpoName?.trim()) missing.push('dpoName');
  if (!app.dpoEmail?.trim()) missing.push('dpoEmail');
  return missing;
}

export function buildAppVerificationSummary(
  app: AppVerificationInput,
): AppVerificationSummary {
  const businessVerification: VerificationItem = app.verified
    ? { status: 'complete', missingRequirements: [] }
    : { status: 'pending', missingRequirements: ['businessApproval'] };

  const accessMissing = [
    ...hasIdentity(app),
    ...hasLegalLinks(app),
    ...hasDpo(app),
    ...(app.verified ? [] : ['businessVerification']),
  ];

  let accessVerification: VerificationItem;
  if (app.accessVerified) {
    accessVerification = { status: 'complete', missingRequirements: [] };
  } else if (app.accessReviewRequestedAt && accessMissing.length === 0) {
    accessVerification = {
      status: 'pending',
      missingRequirements: ['platformReview'],
    };
  } else if (accessMissing.length === 0) {
    accessVerification = {
      status: 'missing',
      missingRequirements: ['submitReview'],
    };
  } else {
    accessVerification = { status: 'missing', missingRequirements: accessMissing };
  }

  const canSubmitAccessReview =
    !app.accessVerified &&
    !app.accessReviewRequestedAt &&
    accessMissing.filter((r) => r !== 'submitReview').length === 0;

  return {
    businessVerification,
    accessVerification,
    canSubmitAccessReview,
  };
}
