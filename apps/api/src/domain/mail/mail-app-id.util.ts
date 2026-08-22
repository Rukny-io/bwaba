export const MAIL_APP_ID_PATTERN = /^\d{16}$/;

export function isMailAppPublicId(value: string | null | undefined): value is string {
  return Boolean(value && MAIL_APP_ID_PATTERN.test(value));
}
