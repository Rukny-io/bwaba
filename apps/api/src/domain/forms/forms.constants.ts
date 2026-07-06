export const FORMS_MAX_PAGE_LIMIT = 100;
export const FORMS_MAX_SUBMIT_BODY_BYTES = 5 * 1024 * 1024; // 5MB
export const FORMS_SUBMIT_BODY_PARSER_LIMIT = '5mb';

export const FORMS_IDEMPOTENCY_TTL_SECONDS = 86400; // 24h
export const FORMS_IDEMPOTENCY_LOCK_TTL_SECONDS = 120;

export const FORMS_OTP_TTL_SECONDS = 600; // 10 min
export const FORMS_OTP_VERIFIED_TTL_SECONDS = FORMS_OTP_TTL_SECONDS * 6;
export const FORMS_OTP_MAX_ATTEMPTS = 5;
export const FORMS_OTP_LOCK_SECONDS = 1800; // 30 min
export const FORMS_OTP_RESEND_COOLDOWN_SECONDS = 60;

export const FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS = 3600;
export const FORMS_PUBLIC_UPLOAD_MAX_FILES_PER_SESSION = 5;
export const FORMS_PUBLIC_UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const FORMS_PUBLIC_UPLOAD_DAILY_IP_BYTES = 50 * 1024 * 1024;
export const FORMS_PUBLIC_UPLOAD_DAILY_FORM_BYTES = 200 * 1024 * 1024;

export const FORMS_PUBLIC_UPLOAD_ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

