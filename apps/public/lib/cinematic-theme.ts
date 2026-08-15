export const productFilters = [
  { id: 'all', label: 'الكل' },
  { id: 'stores', label: 'المتاجر' },
  { id: 'forms', label: 'النماذج' },
  { id: 'profile', label: 'الملف الشخصي' },
  { id: 'analytics', label: 'التحليلات' },
  { id: 'ai', label: 'الذكاء الاصطناعي' },
] as const;

export type ProductFilterId = (typeof productFilters)[number]['id'];
