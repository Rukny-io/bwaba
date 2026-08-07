'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
  X,
  Mail,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Button } from '@heroui/react';
import {
  primaryNavItems,
  middleNavItems,
  bottomNavItems,
  isNavItemActive,
} from '@/components/app/nav-config';

const dockItems = [
  primaryNavItems[0],
  primaryNavItems[1],
  primaryNavItems[2],
  bottomNavItems[0],
];

const drawerItems = [...middleNavItems, bottomNavItems[1]];

function DockButton({
  href,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  href?: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={`relative flex items-center justify-center transition-all duration-200 ${
        isActive
          ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
      }`}
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
      {isActive && (
        <span className="inline-block whitespace-nowrap text-[12px] font-bold tracking-tight">
          {label}
        </span>
      )}
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

export function MobileDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  async function handleLogout() {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login?session=logout';
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 sm:hidden"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
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
            className="fixed inset-x-3 bottom-[5.2rem] z-50 flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto rounded-[28px] border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-2xl backdrop-blur-[40px] sm:hidden"
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
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-danger"
              onPress={() => void handleLogout()}
            >
              <LogOut size={16} />
              تسجيل الخروج
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="pointer-events-auto relative mb-3 flex justify-center">
          <nav
            dir="rtl"
            aria-label="التنقل الرئيسي"
            className="flex items-center gap-0.5 rounded-[26px] border border-[var(--border)] bg-[var(--surface)]/95 px-[5px] py-1 shadow-xl backdrop-blur-[32px]"
          >
            {dockItems.map(({ href, icon, label, exact }) => (
              <DockButton
                key={href}
                href={href}
                icon={icon}
                label={label}
                isActive={isNavItemActive(pathname, href, exact)}
              />
            ))}
            <div className="mx-0.5 h-4 w-px shrink-0 rounded-[1px] bg-[var(--border)]" />
            <DockButton
              icon={open ? X : MoreHorizontal}
              label="المزيد"
              isActive={open}
              onClick={() => setOpen((v) => !v)}
            />
          </nav>
        </div>
      </div>
    </>
  );
}
