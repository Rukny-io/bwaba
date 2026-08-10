import { ConfigService } from '@nestjs/config';

const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** Scopes for Google Sheets sync (create spreadsheet + read/write cells). */
export const GOOGLE_SHEETS_SCOPES = [SHEETS_SCOPE] as const;

/** Extra scope when uploading files to Drive folders created by the app. */
export const GOOGLE_DRIVE_FILE_SCOPES = [DRIVE_FILE_SCOPE] as const;

/** Sheets + Drive connect from the forms integrations UI (single OAuth grant). */
export const GOOGLE_FORMS_INTEGRATION_SCOPES = [
  SHEETS_SCOPE,
  DRIVE_FILE_SCOPE,
] as const;

export function resolveGoogleClientCredentials(config: ConfigService): {
  clientId: string | undefined;
  clientSecret: string | undefined;
} {
  return {
    clientId:
      config.get<string>('GOOGLE_SHEETS_CLIENT_ID') ||
      config.get<string>('GOOGLE_CALENDAR_CLIENT_ID') ||
      config.get<string>('GOOGLE_CLIENT_ID'),
    clientSecret:
      config.get<string>('GOOGLE_SHEETS_CLIENT_SECRET') ||
      config.get<string>('GOOGLE_CALENDAR_CLIENT_SECRET') ||
      config.get<string>('GOOGLE_CLIENT_SECRET'),
  };
}

/**
 * Public OAuth callback URL (must match Google Cloud Console exactly).
 * Never use internal Docker API_URL (http://api:3001) for OAuth redirects.
 */
export function resolveGoogleIntegrationRedirectUri(
  config: ConfigService,
  envKey: string,
  integrationSlug: string,
): string {
  const explicit = config.get<string>(envKey)?.trim();
  if (explicit) return explicit;

  const publicBase = (
    config.get<string>('API_PUBLIC_URL') ||
    config.get<string>('AUTH_BASE_URL') ||
    'http://localhost:3001'
  ).replace(/\/$/, '');

  return `${publicBase}/api/v1/integrations/${integrationSlug}/callback`;
}
