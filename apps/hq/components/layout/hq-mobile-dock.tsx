'use client';

import { useCallback, useState, type ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MoreHorizontal, X } from 'lucide-react';
import {
  mobileDockItems,
  mobileDrawerItems,
  isNavItemActive,
} from '@/components/layout/nav-config';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';

function DockButton({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  href?: string;
  icon: ElementType;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        'relative flex items-center justify-center transition-all duration-200',
        isActive
          ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
      style={{
        borderRadius: 20,
        height: 42,
        padding: '0 14px',
        gap: isActive ? 6 : 0,
      }}
    >
      <Icon
        size={18}
        strokeWidth={isActive ? 2.2 : 1.7}
        style={{ flexShrink: 0 }}
      />
      {isActive ? (
        <span className="inline-block whitespace-nowrap text-[12px] font-bold tracking-tight">
          {label}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} style={{ display: 'flex' }} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        display: 'flex',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  );
}

export function HqMobileDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[12px] sm:hidden"
          onClick={handleClose}
        />
      ) : null}

      {open ? (
        <div
          dir="rtl"
          className="fixed inset-x-3 bottom-[5.2rem] z-50 flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-2xl backdrop-blur-[40px] sm:hidden"
        >
          {mobileDrawerItems.map(({ href, icon: Icon, label, mobileLabel }) => {
            const active = isNavItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={handleClose}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors',
                  active
                    ? 'bg-[var(--surface-secondary)]'
                    : 'hover:bg-[var(--surface-secondary)]',
                )}
              >
                <Icon size={18} strokeWidth={1.8} />
                {mobileLabel ?? label}
              </Link>
            );
          })}
          <div className="mx-1 my-1 h-px bg-[var(--border)]" />
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      ) : null}

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
          style={{
            background:
              'linear-gradient(to top, var(--background) 35%, transparent 100%)',
          }}
        />
        <div className="pointer-events-auto relative mb-3 flex justify-center px-3">
          <nav
            dir="rtl"
            aria-label="التنقل الرئيسي"
            className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[26px] border border-[var(--border)] bg-[var(--surface)]/95 px-[5px] py-1 shadow-xl backdrop-blur-[32px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {mobileDockItems.map(({ href, icon, label, mobileLabel, exact }) => (
              <DockButton
                key={href}
                href={href}
                icon={icon}
                label={mobileLabel ?? label}
                isActive={isNavItemActive(pathname, href, exact)}
                onClick={handleClose}
              />
            ))}
            <div className="mx-0.5 h-4 w-px shrink-0 rounded-[1px] bg-[var(--border)]" />
            <DockButton
              icon={open ? X : MoreHorizontal}
              label="المزيد"
              isActive={open}
              onClick={() => setOpen((value) => !value)}
            />
          </nav>
        </div>
      </div>
    </>
  );
}
