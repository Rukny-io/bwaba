import type { ResolvedGeo } from '../services/form-geo-resolver.service';
import { countryDisplayNames } from '../data/country-labels';

export interface RespondentCountryValue {
  countryCode: string;
  countryName: string;
  countryNameAr: string;
}

export function buildRespondentCountryValue(
  geo: ResolvedGeo | null,
): RespondentCountryValue {
  const code = geo?.countryCode?.toUpperCase().slice(0, 2) || 'XX';
  const labels = countryDisplayNames(code);
  return {
    countryCode: code,
    countryName: geo?.countryName?.trim() || labels.name,
    countryNameAr: labels.nameAr,
  };
}

export function injectRespondentCountryFields(
  fields: Array<{ id: string; type: string }>,
  data: Record<string, unknown>,
  geo: ResolvedGeo | null,
): Record<string, unknown> {
  const countryFields = fields.filter((f) => f.type === 'RESPONDENT_COUNTRY');
  if (countryFields.length === 0) return data;

  const value = buildRespondentCountryValue(geo);
  const next = { ...data };
  for (const field of countryFields) {
    next[field.id] = value;
  }
  return next;
}
