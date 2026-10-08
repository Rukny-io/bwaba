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
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    id: 'basics',
    label: 'المعلومات الأساسية',
    description: 'الاسم، الرابط، والحساب',
    pageTitle: 'المعلومات الأساسية',
    pageDescription: 'الملف الظاهر للزوار، الخصوصية، وبيانات الحساب.',
  },
  {
    id: 'appearance',
    label: 'المظهر واللغة',
    description: 'ثيم الصفحة ولغة الواجهة',
    pageTitle: 'المظهر واللغة',
    pageDescription: 'تخصيص مظهر صفحتك العامة وإعدادات اللغة.',
  },
  {
    id: 'payments',
    label: 'الدفع الإلكتروني',
    description: 'بوابات الدفع والتحصيل',
    pageTitle: 'الدفع الإلكتروني',
    pageDescription: 'ربط وسائل الدفع وإعدادات التحصيل في متجرك.',
  },
  {
    id: 'delivery',
    label: 'شركات التوصيل',
    description: 'الشحن والتسليم',
    pageTitle: 'شركات التوصيل',
    pageDescription: 'إعداد شركات التوصيل وخيارات الشحن للطلبات.',
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
