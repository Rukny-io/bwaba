'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart3,
  BrainCircuit,
  ClipboardList,
  ShoppingBag,
  UserCircle2,
  type LucideIcon,
} from 'lucide-react';
import { productTints } from '@/lib/public-antigravity-theme';

export type ProductBlockId = keyof typeof productTints;

export type ProductBlock = {
  id: ProductBlockId;
  index: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const PRODUCT_META: Array<{
  id: ProductBlockId;
  index: string;
  href: string;
  icon: LucideIcon;
}> = [
  { id: 'stores', index: '01', href: '/products/stores', icon: ShoppingBag },
  { id: 'forms', index: '02', href: '/products/forms', icon: ClipboardList },
  { id: 'profile', index: '03', href: '/products/profile', icon: UserCircle2 },
  { id: 'analytics', index: '04', href: '/products/analytics', icon: BarChart3 },
  { id: 'ai', index: '05', href: '/products/ai', icon: BrainCircuit },
];

export function useProductBlocks(): ProductBlock[] {
  const t = useTranslations('home.products.items');

  return PRODUCT_META.map((item) => ({
    ...item,
    title: t(`${item.id}.title`),
    subtitle: t(`${item.id}.subtitle`),
    description: t(`${item.id}.description`),
  }));
}
