export type MarketingSubnavLink = {
  label: string;
  href: string;
  icon?: string;
  showArrow?: boolean;
};

export type MarketingDropdownPanel = {
  id: string;
  title: string;
  overviewHref?: string;
  overviewLabel?: string;
  subnavLabel?: string;
  links: MarketingSubnavLink[];
};

export type MarketingNavItem =
  | {
      type: 'dropdown';
      label: string;
      panelId: string;
    }
  | {
      type: 'link';
      label: string;
      href: string;
    };

export const marketingNavItems: MarketingNavItem[] = [
  { type: 'dropdown', label: 'المنتجات', panelId: 'product' },
  { type: 'dropdown', label: 'حالات الاستخدام', panelId: 'use-cases' },
  { type: 'link', label: 'الأسعار', href: '/pricing' },
  { type: 'link', label: 'المؤسسات', href: '/enterprise' },
  { type: 'dropdown', label: 'الموارد', panelId: 'resources' },
];

export const marketingDropdownPanels: MarketingDropdownPanel[] = [
  {
    id: 'product',
    title: 'استكشف منتجات الجيل القادم',
    overviewHref: '/products',
    overviewLabel: 'عرض الكل',
    subnavLabel: 'المنتجات',
    links: [
      { label: 'المتاجر الإلكترونية', href: '/products/stores', icon: 'storefront' },
      { label: 'النماذج الذكية', href: '/products/forms', icon: 'assignment' },
      { label: 'الملف الشخصي', href: '/products/profile', icon: 'account_circle' },
      { label: 'التحليلات', href: '/products/analytics', icon: 'monitoring' },
    ],
  },
  {
    id: 'use-cases',
    title: 'مصممة لرواد الأعمال في العصر الرقمي',
    overviewHref: '/use-cases',
    overviewLabel: 'عرض الكل',
    links: [
      { label: 'التجارة الإلكترونية', href: '/use-cases/ecommerce' },
      { label: 'العلامة الشخصية', href: '/use-cases/personal-brand' },
      { label: 'جمع البيانات', href: '/use-cases/forms' },
      { label: 'الفرق والمؤسسات', href: '/use-cases/teams' },
    ],
  },
  {
    id: 'resources',
    title: 'كل ما تحتاجه للبقاء على اطلاع والحصول على المساعدة',
    links: [
      { label: 'الوثائق', href: '/docs', showArrow: true },
      { label: 'المدونة', href: '/blog' },
      { label: 'سجل التحديثات', href: '/changelog' },
      { label: 'الدعم', href: '/support' },
      { label: 'المطورون', href: '/developers' },
    ],
  },
];
