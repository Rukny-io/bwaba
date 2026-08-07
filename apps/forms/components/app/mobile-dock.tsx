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
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="drawer"
            dir="rtl"
            className="fixed inset-x-3 bottom-[5.75rem] z-50 flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto rounded-[28px] border border-white/40 bg-white/80 p-3 shadow-2xl backdrop-blur-2xl sm:hidden dark:border-white/10 dark:bg-[var(--surface)]/90"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
          >
            {drawerItems.map(({ href, icon: Icon, label }) => {
              const active = isNavItemActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={handleClose}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors ${
                    active
                      ? 'bg-[var(--surface-secondary)]'
                      : 'hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {label}
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
