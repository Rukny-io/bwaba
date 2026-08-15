export const marketingTheme = {
  brand: '#062c30',
  text: '#132327',
  muted: 'rgba(19, 35, 39, 0.55)',
  border: '#e8ecf0',
  surface: '#f6f7f8',
  headerHeight: 52,
  containerMax: 1212,
} as const;

/** Shared layout tokens — keep homepage & pricing aligned on mobile */
export const marketingLayout = {
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6',
  heroPad: 'pt-8 pb-12 sm:pt-14 sm:pb-16 md:pt-16',
  heroBadge:
    'inline-flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 rounded-full border border-[#E8ECF0] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#132327]/70 backdrop-blur-sm sm:max-w-none sm:text-xs',
  heroTitle:
    'text-balance text-center text-[1.625rem] font-bold leading-[1.18] tracking-[-0.02em] text-[#132327] sm:text-4xl md:text-5xl lg:text-[3.25rem]',
  heroLead:
    'mx-auto max-w-md text-center text-[15px] leading-[1.75] text-[#132327]/75 sm:text-base md:text-lg',
  sectionTitle:
    'text-[1.75rem] font-bold leading-[1.2] tracking-[-0.02em] text-[#132327] sm:text-3xl md:text-[2.25rem]',
  sectionEyebrow: 'text-[13px] font-medium text-[#132327]/50',
} as const;

export const marketingNav = {
  products: [
    {
      name: 'المتاجر الإلكترونية',
      href: '/products/stores',
      description: 'أنشئ متجرك وابدأ البيع بسهولة',
    },
    {
      name: 'النماذج الذكية',
      href: '/products/forms',
      description: 'اجمع البيانات وأنشئ الاستبيانات',
    },
    {
      name: 'الملف الشخصي',
      href: '/products/profile',
      description: 'اجمع روابطك ومنتجاتك في صفحة واحدة',
    },
    {
      name: 'التحليلات',
      href: '/products/analytics',
      description: 'تابع أداء أعمالك من لوحة موحدة',
    },
    {
      name: 'الذكاء الاصطناعي',
      href: '/products/ai',
      description: 'أدوات ذكية لتسريع أعمالك',
    },
  ],
  links: [
    { name: 'حالات الاستخدام', href: '/use-cases' },
    { name: 'الأسعار', href: '/pricing' },
    { name: 'المؤسسات', href: '/enterprise' },
    { name: 'الموارد', href: '/resources' },
  ],
} as const;
