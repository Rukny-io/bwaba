export const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || 'http://localhost:3001';

export const FORWARD_UPLOAD_HEADERS = [
  'cookie',
  'origin',
  'referer',
  'user-agent',
  'x-forwarded-for',
  'x-real-ip',
  'x-csrf-token',
] as const;

export function isUploadBlob(value: FormDataEntryValue | null): value is File {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Blob).arrayBuffer === 'function' &&
    typeof (value as File).size === 'number' &&
    (value as File).size > 0
  );
}
