'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  APP_BASE,
  primaryNavItems,
  bottomNavItems,
  isNavItemActive,
} from '@/components/app/nav-config';

const dockItems = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  bottomNavItems[0],
];

export function DashboardMobileDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2 backdrop-blur-md sm:hidden"
      aria-label="التنقل السريع"
    >
      <ul className="mx-auto flex max-w-md items-center justify-between gap-1">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href, item.exact);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]'
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={`${APP_BASE}/mail/compose`}
            className="flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium text-[var(--primary)]"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] text-base leading-none">
              +
            </span>
            <span>إنشاء</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
