export type ImageFieldRules = {
  imageUrl?: string;
  alt?: string;
};

export type LegalConsentRules = {
  consentText?: string;
  linkUrl?: string;
  linkLabel?: string;
};

export type YesNoFieldRules = {
  yesLabel?: string;
  noLabel?: string;
};

function asRecord(rules: unknown): Record<string, unknown> {
  if (!rules || typeof rules !== 'object') return {};
  return rules as Record<string, unknown>;
}

export function getImageFieldRules(rules: unknown): ImageFieldRules {
  const r = asRecord(rules);
  return {
    imageUrl: typeof r.imageUrl === 'string' ? r.imageUrl : '',
    alt: typeof r.alt === 'string' ? r.alt : '',
  };
}

export function setImageFieldRules(
  rules: unknown,
  patch: Partial<ImageFieldRules>,
): ImageFieldRules {
  return { ...getImageFieldRules(rules), ...patch };
}

export function getLegalConsentRules(rules: unknown): LegalConsentRules {
  const r = asRecord(rules);
  return {
    consentText:
      typeof r.consentText === 'string'
        ? r.consentText
        : 'أوافق على الشروط والأحكام.',
    linkUrl: typeof r.linkUrl === 'string' ? r.linkUrl : '',
    linkLabel: typeof r.linkLabel === 'string' ? r.linkLabel : 'اقرأ الشروط',
  };
}

export function setLegalConsentRules(
  rules: unknown,
  patch: Partial<LegalConsentRules>,
): LegalConsentRules {
  return { ...getLegalConsentRules(rules), ...patch };
}

export function getYesNoLabels(rules: unknown): { yes: string; no: string } {
  const r = asRecord(rules);
  return {
    yes: typeof r.yesLabel === 'string' && r.yesLabel.trim() ? r.yesLabel : 'نعم',
    no: typeof r.noLabel === 'string' && r.noLabel.trim() ? r.noLabel : 'لا',
  };
}

export function setYesNoLabels(
  rules: unknown,
  patch: Partial<YesNoFieldRules>,
): YesNoFieldRules {
  const current = getYesNoLabels(rules);
  return {
    yesLabel: patch.yesLabel ?? current.yes,
    noLabel: patch.noLabel ?? current.no,
  };
}

export const NPS_DEFAULT_LABELS = {
  minLabel: 'غير محتمل',
  maxLabel: 'محتمل جداً',
} as const;
