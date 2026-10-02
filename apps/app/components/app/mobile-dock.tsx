'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  APP_BASE,
  primaryDockItems,
  productsDockItems,
  isNavItemActive,
  isStoreDockMode,
} from '@/components/app/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/app/mobile-dock-primitives';

export function MobileDock() {
  const pathname = usePathname();
  const inStoreMode = isStoreDockMode(pathname);
  const items = inStoreMode ? productsDockItems : primaryDockItems;

  return (
    <MobileDockShell>
      <MobileDockPill aria-label="التنقل الرئيسي">
        {inStoreMode ? (
          <MobileDockItem
            href={APP_BASE}
            icon={ChevronRight}
            label="رجوع"
            isActive={false}
            showLabel
            forceLabel
          />
        ) : null}

        {items.map(({ href, icon, label, exact }) =>
          icon ? (
            <MobileDockItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              isActive={isNavItemActive(pathname, href, exact)}
            />
          ) : null,
        )}
      </MobileDockPill>
    </MobileDockShell>
  );
}
