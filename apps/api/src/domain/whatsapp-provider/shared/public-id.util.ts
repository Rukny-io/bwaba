import { randomInt } from 'crypto';

/** 16-digit numeric public id (same scheme as DeveloperApp.appId). */
export function generateNumericPublicId(): string {
  const timestamp = Date.now().toString();
  const randomPart = randomInt(100, 999).toString();
  return (timestamp + randomPart).slice(0, 16);
}
