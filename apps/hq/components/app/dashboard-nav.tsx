'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Dropdown } from '@heroui/react';
import {
  headerHomeLink,
  headerMenus,
  isNavItemActive,
  type HeaderMenu,
  type HeaderMenuItem,
} from '@/components/layout/nav-config';
import {
  dashboardTopTabsChipClass,
  dashboardTopTabsGlassClass,
} from '@/components/app/nav-glass';
import { cn } from '@/lib/utils';

function hrefPath(href: string) {
  return href.split('?')[0] ?? href;
}

function hrefQuery(href: string) {
  return new URLSearchParams(href.split('?')[1] ?? '');
}

function isMenuItemActive(
  pathname: string,
  searchParams: URLSearchParams,
  item: HeaderMenuItem,
) {
  const path = hrefPath(item.href);
  const query = hrefQuery(item.href);
  const pathMatches = item.exact
    ? pathname === path
    : isNavItemActive(pathname, path, item.exact);

  if (!pathMatches) return false;

  for (const [key, value] of query.entries()) {
    if (searchParams.get(key) !== value) return false;
  }

  if ([...query.keys()].length === 0 && item.exact) {
    return pathname === path;
  }

  return true;
}

function isMenuActive(
  pathname: string,
  searchParams: URLSearchParams,
  menu: HeaderMenu,
) {
  return menu.items.some((item) => isMenuItemActive(pathname, searchParams, item));
}

function HeaderMenuDropdown({
  menu,
  pathname,
  searchParams,
  triggerClassName,
}: {
  menu: HeaderMenu;
  pathname: string;
  searchParams: URLSearchParams;
  triggerClassName: string;
}) {
  const router = useRouter();
  const active = isMenuActive(pathname, searchParams, menu);

  return (
    <Dropdown>
      <Dropdown.Trigger
        className={triggerClassName}
        aria-current={active ? 'page' : undefined}
      >
        {menu.label}
        <ChevronDown size={14} className="opacity-70" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" offset={14} className="min-w-[13rem]">
        <Dropdown.Menu
          onAction={(key) => {
            const href = String(key);
            if (href) router.push(href);
          }}
        >
          {menu.items.map((item) => {
            const Icon = item.icon;
            const itemActive = isMenuItemActive(pathname, searchParams, item);
            return (
              <Dropdown.Item
                key={item.href}
                id={item.href}
                textValue={item.label}
                className={cn('gap-2', itemActive && 'font-semibold')}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeActive = pathname === headerHomeLink.href;
  const chipTriggerClass = cn(dashboardTopTabsChipClass, 'gap-1 outline-none');

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-start bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <nav
        aria-label="اختصارات سريعة"
        className={cn(
          'pointer-events-auto inline-flex w-auto max-w-full items-center gap-0.5 p-1 sm:gap-1 sm:p-1.5',
          dashboardTopTabsGlassClass,
          '![overflow:visible]',
        )}
      >
        <Link
          href={headerHomeLink.href}
          aria-current={homeActive ? 'page' : undefined}
          className={cn(dashboardTopTabsChipClass, 'shrink-0')}
        >
          {headerHomeLink.label}
        </Link>

        {headerMenus.map((menu) => (
          <HeaderMenuDropdown
            key={menu.id}
            menu={menu}
            pathname={pathname}
            searchParams={searchParams}
            triggerClassName={cn(
              chipTriggerClass,
              menu.id === 'billing' && 'hidden md:inline-flex',
              menu.id === 'team' && 'hidden lg:inline-flex',
            )}
          />
        ))}
      </nav>
    </header>
  );
}
