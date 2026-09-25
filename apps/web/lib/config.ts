export const API_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3006'
).replace(/\/$/, '');

export function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}
