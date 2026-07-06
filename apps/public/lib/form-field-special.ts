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

export function getYesNoLabels(rules: unknown): { yes: string; no: string } {
  const r = asRecord(rules);
  return {
    yes: typeof r.yesLabel === 'string' && r.yesLabel.trim() ? r.yesLabel : 'نعم',
    no: typeof r.noLabel === 'string' && r.noLabel.trim() ? r.noLabel : 'لا',
  };
}
