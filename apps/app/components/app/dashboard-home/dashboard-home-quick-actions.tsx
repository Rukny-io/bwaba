'use client';

import Link from 'next/link';
import {
  BarChart2,
  Link2,
  Package,
  Plus,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function DashboardHomeQuickActions() {
  const { t } = useTranslations();

  const actions: Array<{ href: string; icon: LucideIcon; label: string }> = [
    { href: '/app/links?add=1', icon: Plus, label: t('home.newLink') },
    { href: '/app/links', icon: Link2, label: t('nav.links') },
    { href: '/app/products', icon: Package, label: t('nav.products') },
    { href: '/app/orders', icon: ShoppingBag, label: t('nav.orders') },
    { href: '/app/analytics', icon: BarChart2, label: t('nav.analytics') },
  ];

  return (
    <div className={cn(dashboardPagePanelClass, 'gap-4')}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {t('home.quickActions')}
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t('home.quickActionsHint')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {actions.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4',
              'text-sm font-medium text-[var(--foreground)] transition-colors',
              'hover:border-[color-mix(in_srgb,var(--border)_65%,var(--foreground)_35%)] hover:bg-[var(--surface-secondary)]',
            )}
          >
            <Icon className="size-4 text-[var(--muted-foreground)]" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
