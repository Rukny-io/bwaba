export interface RespondentCountryValue {
  countryCode: string;
  countryName: string;
  countryNameAr: string;
}

export function isRespondentCountryValue(
  value: unknown,
): value is RespondentCountryValue {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return typeof o.countryCode === 'string' && typeof o.countryNameAr === 'string';
}

export function formatRespondentCountryValue(value: unknown): string {
  if (isRespondentCountryValue(value)) {
    return value.countryNameAr || value.countryName || value.countryCode;
  }
  return '';
}
