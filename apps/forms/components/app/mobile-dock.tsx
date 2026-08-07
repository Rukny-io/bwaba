'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
  X,
  LogOut,
  Plus,
  ChevronLeft,
} from 'lucide-react';
import {
  primaryNavItems,
  middleNavItems,
  bottomNavItems,
  isNavItemActive,
} from '@/components/app/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
  MobileDockFab,
} from '@/components/app/mobile-dock-primitives';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';

const dockItems = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  bottomNavItems[0],
];

const drawerItems = [...middleNavItems, bottomNavItems[1]];

export function MobileDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  async function handleLogout() {
    setOpen(false);
    await logoutWithNotification();
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 sm:hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.28)',
              backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            dir="rtl"
            role="menu"
            aria-label="المزيد"
            className="fixed inset-x-0 bottom-[5.85rem] z-50 mx-auto w-[min(100%-1.5rem,22rem)] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/95 shadow-[var(--card-shadow)] backdrop-blur-2xl sm:hidden"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          >
            <div className="border-b border-[var(--border)] px-4 pb-2.5 pt-3.5">
              <p className="text-[11px] font-semibold tracking-wide text-[var(--muted-foreground)]">
                المزيد من الخيارات
              </p>
            </div>

            <div className="flex flex-col gap-1 p-2">
              {drawerItems.map(({ href, icon: Icon, label }, index) => {
                const active = isNavItemActive(pathname, href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * index, duration: 0.22 }}
                  >
                    <Link
                      href={href}
                      role="menuitem"
                      onClick={handleClose}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors',
                        active
                          ? 'bg-[var(--surface-secondary)]'
                          : 'hover:bg-[var(--surface-secondary)]/80',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-2xl',
                          active
                            ? 'bg-[var(--brand-lime)] text-[var(--primary-foreground)]'
                            : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
                        )}
                      >
                        <Icon size={18} strokeWidth={1.9} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] font-semibold text-[var(--foreground)]">
                        {label}
                      </span>
                      <ChevronLeft
                        size={16}
                        strokeWidth={2}
                        className="shrink-0 text-[var(--muted-foreground)]/70"
                        aria-hidden
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            <div className="border-t border-[var(--border)] p-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[var(--danger)]">
                  <LogOut size={17} strokeWidth={1.9} aria-hidden />
                </span>
                <span className="text-[14px] font-semibold">تسجيل الخروج</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileDockShell>
        <MobileDockPill aria-label="التنقل الرئيسي">
          {dockItems.map(({ href, icon, label, exact }) => (
            <MobileDockItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              isActive={isNavItemActive(pathname, href, exact)}
            />
          ))}
          <MobileDockItem
            icon={open ? X : MoreHorizontal}
            label="المزيد"
            isActive={open}
            showLabel={false}
            onClick={() => setOpen((v) => !v)}
          />
        </MobileDockPill>

        <MobileDockFab
          href={FORMS_CREATE_ENTRY_PATH}
          label="إنشاء نموذج"
          icon={Plus}
        />
      </MobileDockShell>
    </>
  );
}
