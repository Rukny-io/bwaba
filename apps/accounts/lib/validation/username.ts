/** Shared username rules across auth and manage flows */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_PATTERN = /^[a-z0-9_-]+$/;

export function sanitizeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function isValidUsername(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= USERNAME_MIN_LENGTH && USERNAME_PATTERN.test(trimmed);
}
