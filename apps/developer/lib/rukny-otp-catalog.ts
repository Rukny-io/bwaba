/** Public Rukny OTP REST base (same host as other v1 APIs). */

export const RUKNY_OTP_PUBLIC_BASE =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')) ||
  'https://api.rukny.io/api/v1';

/** Scalar interactive reference (OpenAPI), on the API host. */
export const RUKNY_API_REFERENCE_URL =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_REFERENCE_URL?.replace(/\/$/, '')) ||
  'https://api.rukny.io/api/reference';

export const RUKNY_OTP_SEND_METHOD = 'POST';
export const RUKNY_OTP_SEND_PATH = '/otp/send';

export type RuknyOtpEndpointId = 'sendOtp';

export interface RuknyOtpEndpoint {
  id: RuknyOtpEndpointId;
  method: 'POST';
  path: string;
}

export const RUKNY_OTP_ENDPOINTS: RuknyOtpEndpoint[] = [
  { id: 'sendOtp', method: 'POST', path: RUKNY_OTP_SEND_PATH },
];

export function ruknyOtpSendUrl(): string {
  return `${RUKNY_OTP_PUBLIC_BASE}${RUKNY_OTP_SEND_PATH}`;
}

export const RUKNY_OTP_EXAMPLE_BODY = `{
  "to": "+964771234567",
  "code": "482913"
}`;

export function buildRuknyOtpCurlExample(apiKeyPlaceholder = 'rk_live_xxxxxxxx'): string {
  return `curl -X POST '${ruknyOtpSendUrl()}' \\
  -H 'X-API-Key: ${apiKeyPlaceholder}' \\
  -H 'Content-Type: application/json' \\
  -d '${RUKNY_OTP_EXAMPLE_BODY.replace(/\n/g, '')}'`;
}
