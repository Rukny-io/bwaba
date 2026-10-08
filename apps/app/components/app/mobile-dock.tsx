'use client';

import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  APP_BASE,
  getNavLabel,
  primaryDockItems,
  productsDockItems,
  isNavItemActive,
  isStoreDockMode,
} from '@/components/app/nav-config';
import { useTranslations } from '@/lib/i18n';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/app/mobile-dock-primitives';

export function MobileDock() {
  const pathname = usePathname();
  const { t, locale } = useTranslations();
  const inStoreMode = isStoreDockMode(pathname);
  const items = inStoreMode ? productsDockItems : primaryDockItems;

  return (
    <MobileDockShell>
      <MobileDockPill aria-label={t('chrome.primaryNav')}>
        {inStoreMode ? (
          <MobileDockItem
            href={APP_BASE}
            icon={ChevronLeft}
            label={t('common.back')}
            isActive={false}
            showLabel
            forceLabel
            iconClassName="rtl:rotate-180"
          />
        ) : null}

        {items.map((item) =>
          item.icon ? (
            <MobileDockItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={getNavLabel(item, locale)}
              isActive={isNavItemActive(pathname, item.href, item.exact)}
            />
          ) : null,
        )}
      </MobileDockPill>
    </MobileDockShell>
  );
}
