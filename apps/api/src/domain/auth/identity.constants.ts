export const IDENTITY_UPLOAD_PREFIX = 'identity';
export const IDENTITY_MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const IDENTITY_PRESIGN_TTL_SECONDS = 600; // 10 min
export const IDENTITY_SESSION_TTL_SECONDS = 1800; // 30 min
export const IDENTITY_ADMIN_VIEW_TTL_SECONDS = 120;
export const IDENTITY_DOC_RETENTION_DAYS = 30;
export const IDENTITY_PRESIGN_RATE_LIMIT = 20; // per hour per user
export const IDENTITY_SUBMIT_RATE_LIMIT = 3; // per 24h per user

export const IDENTITY_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type IdentityDocumentType =
  | 'national_id'
  | 'passport'
  | 'driving_license';

export type IdentityDocumentSlot =
  | 'primary_front'
  | 'primary_back'
  | 'residence_front'
  | 'residence_back'
  | 'selfie'; // legacy admin view only

export const IDENTITY_UPLOAD_SLOTS: IdentityDocumentSlot[] = [
  'primary_front',
  'primary_back',
  'residence_front',
  'residence_back',
];

export function requiredIdentitySlots(
  documentType: IdentityDocumentType,
): IdentityDocumentSlot[] {
  const base: IdentityDocumentSlot[] = [
    'primary_front',
    'residence_front',
    'residence_back',
  ];
  if (documentType === 'passport') {
    return base;
  }
  return [...base, 'primary_back'];
}
