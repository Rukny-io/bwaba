import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
} from 'lucide-react';

export type ProductNavId = 'stores' | 'forms' | 'profile' | 'analytics' | 'ai';

export type ProductNavConfig = {
  id: ProductNavId;
  href: string;
  icon: LucideIcon;
};

export const PRODUCT_NAV_CONFIG: ProductNavConfig[] = [
  { id: 'stores', href: '/products/stores', icon: ShoppingBag },
  { id: 'forms', href: '/products/forms', icon: ClipboardList },
  { id: 'profile', href: '/products/profile', icon: UserCircle2 },
  { id: 'analytics', href: '/products/analytics', icon: BarChart3 },
  { id: 'ai', href: '/products/ai', icon: BrainCircuit },
];

export const MAIN_NAV_LINKS = [
  { key: 'pricing' as const, href: '/pricing' },
  { key: 'enterprise' as const, href: '/enterprise' },
];

export const FOOTER_LINK_HREFS = {
  products: {
    stores: '/products/stores',
    forms: '/products/forms',
    profile: '/products/profile',
    analytics: '/products/analytics',
    ai: '/products/ai',
    viewAll: '/#products',
  },
  platform: {
    home: '/',
    pricing: '/pricing',
    enterprise: '/enterprise',
    about: '/#about',
  },
  resources: {
    docs: '/docs',
    developers: '/developers',
    helpCenter: '/support',
    faq: '/pricing#faq-heading',
  },
  account: {
    startFree: 'accounts',
    login: 'accounts',
    createStore: '/products/stores',
    createForm: '/products/forms',
  },
} as const;
