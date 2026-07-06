export const API_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function getBackendUrl(): string {
  return (
    process.env.API_BACKEND_URL ||
    process.env.API_URL ||
    'http://localhost:3001'
  );
}
