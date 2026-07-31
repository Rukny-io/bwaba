/** Field types supported in the create wizard (subset of API FieldType). */

export type WizardFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'TOGGLE'
  | 'YES_NO'
  | 'LEGAL_CONSENT'
  | 'IRAQ_GOVERNORATE'
  | 'FILE'
  | 'SIGNATURE'
  | 'MATRIX'
  | 'RANKING'
  | 'RATING'
  | 'SCALE'
  | 'NPS'
  | 'RECAPTCHA'
  | 'RESPONDENT_COUNTRY'
  | 'HEADING'
  | 'PARAGRAPH'
  | 'DIVIDER'
  | 'IMAGE';

export const WIZARD_FIELD_TYPE_LABELS: Record<WizardFieldType, string> = {
  TEXT: 'نص قصير',
  TEXTAREA: 'نص طويل',
  EMAIL: 'بريد إلكتروني',
  PHONE: 'هاتف',
  URL: 'رابط',
  NUMBER: 'رقم',
  DATE: 'تاريخ',
  TIME: 'وقت',
  DATETIME: 'تاريخ ووقت',
  SELECT: 'قائمة منسدلة',
  MULTISELECT: 'اختيار متعدد',
  RADIO: 'اختيار واحد',
  CHECKBOX: 'موافقة / خانة',
  TOGGLE: 'مفتاح تفعيل',
  YES_NO: 'نعم / لا',
  LEGAL_CONSENT: 'موافقة قانونية',
  IRAQ_GOVERNORATE: 'محافظة عراقية',
  FILE: 'رفع ملف',
  SIGNATURE: 'توقيع',
  MATRIX: 'مصفوفة',
  RANKING: 'ترتيب',
  RATING: 'تقييم',
  SCALE: 'مقياس',
  NPS: 'NPS (0–10)',
  RECAPTCHA: 'Turnstile',
  RESPONDENT_COUNTRY: 'بلد المستجيب',
  HEADING: 'عنوان',
  PARAGRAPH: 'فقرة',
  DIVIDER: 'فاصل',
  IMAGE: 'صورة',
};

export const WIZARD_ADDABLE_FIELD_TYPES: WizardFieldType[] = [
  'TEXT',
  'TEXTAREA',
  'EMAIL',
  'PHONE',
  'URL',
  'NUMBER',
  'DATE',
  'TIME',
  'DATETIME',
  'SELECT',
  'MULTISELECT',
  'RADIO',
  'CHECKBOX',
  'TOGGLE',
  'YES_NO',
  'LEGAL_CONSENT',
  'IRAQ_GOVERNORATE',
  'FILE',
  'SIGNATURE',
  'MATRIX',
  'RANKING',
  'RATING',
  'SCALE',
  'NPS',
  'RECAPTCHA',
  'RESPONDENT_COUNTRY',
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'IMAGE',
];

export function fieldTypeNeedsOptions(type: WizardFieldType): boolean {
  return (
    type === 'SELECT' ||
    type === 'RADIO' ||
    type === 'MULTISELECT' ||
    type === 'RANKING'
  );
}

export function isAutoCapturedWizardField(type: WizardFieldType): boolean {
  return type === 'RESPONDENT_COUNTRY';
}

export function isDecorativeWizardField(type: WizardFieldType): boolean {
  return (
    type === 'RECAPTCHA' ||
    isLayoutWizardField(type) ||
    isAutoCapturedWizardField(type)
  );
}

export function createNpsFieldDefaults() {
  return {
    label: 'ما مدى احتمال أن توصي بنا؟',
    type: 'NPS' as WizardFieldType,
    minValue: 0,
    maxValue: 10,
    minLabel: 'غير محتمل',
    maxLabel: 'محتمل جداً',
    required: true,
  };
}

export function isLayoutWizardField(type: WizardFieldType): boolean {
  return (
    type === 'HEADING' ||
    type === 'PARAGRAPH' ||
    type === 'DIVIDER' ||
    type === 'IMAGE'
  );
}
