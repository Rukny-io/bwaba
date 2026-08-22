'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MoreHorizontal, Moon, Sun, X, type LucideIcon } from 'lucide-react';
import {
  mobileDockItems,
  mobileDrawerItems,
  isNavItemActive,
} from '@/components/layout/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
} from '@/components/layout/mobile-dock-primitives';
import { logoutWithNotification } from '@/lib/auth-notify';
import { useHqTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

function drawerRowClass(active: boolean) {
  return cn(
    'flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors',
    active
      ? 'bg-[var(--surface-secondary)]'
      : 'hover:bg-[var(--surface-secondary)]/80 active:bg-[var(--surface-secondary)]',
  );
}

function DrawerIcon({
  icon: Icon,
  active,
  danger,
}: {
  icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-xl',
        danger
          ? 'bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]'
          : active
            ? 'bg-[var(--foreground)] text-[var(--background)]'
            : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      <Icon size={15} strokeWidth={1.9} aria-hidden />
    </span>
  );
}

export function HqMobileDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useHqTheme();
  const handleClose = useCallback(() => setOpen(false), []);
  const isDark = theme === 'dark';

  async function handleLogout() {
    setOpen(false);
    await logoutWithNotification();
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="إغلاق القائمة"
          className="fixed inset-0 z-40 sm:hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.22)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={handleClose}
        />
      ) : null}

      {open ? (
        <div
          dir="rtl"
          role="menu"
          aria-label="المزيد"
          className="fixed inset-x-0 bottom-[5.5rem] z-50 mx-auto flex max-h-[min(52vh,22rem)] w-[min(100%-2rem,18.5rem)] flex-col overflow-hidden rounded-2xl bg-[var(--surface)]/96 backdrop-blur-xl sm:hidden"
        >
          <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-1.5 py-1.5">
            <div className="flex flex-col gap-0.5 px-1.5 pt-1">
              <p className="px-1.5 pb-1 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">
                المزيد
              </p>
              {mobileDrawerItems.map(({ href, icon: Icon, label, mobileLabel }) => {
                const active = isNavItemActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleClose}
                    className={drawerRowClass(active)}
                  >
                    <DrawerIcon icon={Icon} active={active} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
                      {mobileLabel ?? label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-0.5 border-t border-[var(--border)]/50 px-1.5 pb-0.5 pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={toggleTheme}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
              >
                <DrawerIcon icon={isDark ? Sun : Moon} />
                <span className="text-[13px] font-medium">
                  {isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
              >
                <DrawerIcon icon={LogOut} danger />
                <span className="text-[13px] font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileDockShell>
        <MobileDockPill aria-label="التنقل الرئيسي">
          {mobileDockItems.map(({ href, icon, label, mobileLabel, exact }) => (
            <MobileDockItem
              key={href}
              href={href}
              icon={icon}
              label={mobileLabel ?? label}
              isActive={isNavItemActive(pathname, href, exact)}
              onClick={handleClose}
            />
          ))}
          <MobileDockItem
            icon={open ? X : MoreHorizontal}
            label="المزيد"
            isActive={open}
            showLabel={false}
            onClick={() => setOpen((value) => !value)}
          />
        </MobileDockPill>
      </MobileDockShell>
    </>
  );
}
