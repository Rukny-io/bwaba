'use client';

import { usePathname } from 'next/navigation';
import { APP_BASE } from '@/lib/business-routes';
import {
  getMobileDockItems,
  isNavItemActive,
} from '@/components/layout/nav-config';
import { SidebarIcon } from '@/components/layout/sidebar-icon';
import {
  MobileDockItem,
  MobileDockPill,
  MobileDockShell,
} from '@/components/layout/mobile-dock-primitives';

export function BusinessMobileDock() {
  const pathname = usePathname();
  if (
    pathname.startsWith(`${APP_BASE}/workflows`) ||
    pathname.startsWith(`${APP_BASE}/inbox`)
  ) {
    return null;
  }
  const items = getMobileDockItems();

  return (
    <MobileDockShell>
      <MobileDockPill aria-label="التنقل الرئيسي">
        {items.map(({ href, iconId, label, exact }) => {
          const active = isNavItemActive(pathname, href, exact);

          return (
            <MobileDockItem
              key={href}
              href={href}
              label={label}
              isActive={active}
              iconNode={
                <SidebarIcon
                  iconId={iconId}
                  isActive={active}
                  size={active ? 19 : 21}
                />
              }
            />
          );
        })}
      </MobileDockPill>
    </MobileDockShell>
  );
}
