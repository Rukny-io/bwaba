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
  { type: 'link', label: 'الأسعار', href: '/pricing' },
  { type: 'link', label: 'المؤسسات', href: '/enterprise' },
];

export const marketingDropdownPanels: MarketingDropdownPanel[] = [
  {
    id: 'product',
    title: 'منتجات ركني',
    overviewHref: '/#products',
    overviewLabel: 'عرض الكل',
    subnavLabel: 'المنتجات',
    links: [
      { label: 'المتاجر الإلكترونية', href: '/products/stores', icon: 'storefront' },
      { label: 'النماذج الذكية', href: '/products/forms', icon: 'assignment' },
      { label: 'الملف الشخصي', href: '/products/profile', icon: 'account_circle' },
      { label: 'التحليلات', href: '/products/analytics', icon: 'monitoring' },
      { label: 'الذكاء الاصطناعي', href: '/products/ai' },
    ],
  },
];
