export type SettingsSectionId =
  | 'basics'
  | 'appearance'
  | 'payments'
  | 'delivery';

export const SETTINGS_NAV_WIDTH_PX = 280;

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  label: string;
  description: string;
  pageTitle: string;
  pageDescription: string;
  labelEn: string;
  descriptionEn: string;
  pageTitleEn: string;
  pageDescriptionEn: string;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    id: 'basics',
    label: 'المعلومات الأساسية',
    description: 'الاسم، الرابط، والحساب',
    pageTitle: 'المعلومات الأساسية',
    pageDescription: 'الملف الظاهر للزوار، الخصوصية، وبيانات الحساب.',
    labelEn: 'Basics', descriptionEn: 'Profile, link, and account', pageTitleEn: 'Basics', pageDescriptionEn: 'Your public profile, privacy, and account details.',
  },
  {
    id: 'appearance',
    label: 'المظهر واللغة',
    description: 'سمة لوحة التحكم واللغة',
    pageTitle: 'المظهر واللغة',
    pageDescription: 'سمة لوحة التحكم وإعدادات لغة الواجهة.',
    labelEn: 'Appearance & language', descriptionEn: 'Dashboard theme and language', pageTitleEn: 'Appearance & language', pageDescriptionEn: 'Customize your dashboard theme and interface language.',
  },
  {
    id: 'payments',
    label: 'الدفع الإلكتروني',
    description: 'بوابات الدفع والتحصيل',
    pageTitle: 'الدفع الإلكتروني',
    pageDescription: 'ربط وسائل الدفع وإعدادات التحصيل في متجرك.',
    labelEn: 'Payments', descriptionEn: 'Payment methods and collection', pageTitleEn: 'Payments', pageDescriptionEn: 'Configure payment methods for your store.',
  },
  {
    id: 'delivery',
    label: 'شركات التوصيل',
    description: 'الشحن والتسليم',
    pageTitle: 'شركات التوصيل',
    pageDescription: 'إعداد شركات التوصيل وخيارات الشحن للطلبات.',
    labelEn: 'Delivery', descriptionEn: 'Shipping and fulfillment', pageTitleEn: 'Delivery', pageDescriptionEn: 'Configure delivery methods and shipping fees.',
  },
];

const SECTION_IDS = new Set(SETTINGS_SECTIONS.map((s) => s.id));

export function parseSettingsSection(value: string | null | undefined): SettingsSectionId {
  if (value && SECTION_IDS.has(value as SettingsSectionId)) {
    return value as SettingsSectionId;
  }
  return 'basics';
}

export function getSettingsSectionMeta(id: SettingsSectionId): SettingsSectionMeta {
  return SETTINGS_SECTIONS.find((s) => s.id === id) ?? SETTINGS_SECTIONS[0]!;
}
