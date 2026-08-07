'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { Avatar, Tooltip } from '@heroui/react';
import {
  APP_BASE,
  sidebarNavEntries,
  sidebarFooterItem,
  isNavItemActive,
  isNavGroupActive,
  type NavChild,
  type NavGroup,
  type NavItem,
} from '@/components/app/nav-config';
import { resolveMediaUrl } from '@/lib/media-url';

const STORAGE_KEY = 'rukny-workspace-sidebar-collapsed';
const GUTTER_EXPANDED = '16rem';
const GUTTER_COLLAPSED = '4.25rem';

const EASE_LIQUID = [0.32, 0.72, 0, 1] as const;

const panelTransition = {
  duration: 0.32,
  ease: EASE_LIQUID,
};

const heightFadeTransition = {
  height: { duration: 0.3, ease: EASE_LIQUID },
  opacity: { duration: 0.22, ease: EASE_LIQUID },
};

const labelFadeTransition = {
  duration: 0.2,
  ease: EASE_LIQUID,
};

interface SidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
  userEmail?: string | null;
}

function SidebarTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label={label}>{children}</Tooltip.Trigger>
      <Tooltip.Content placement="left">
        <Tooltip.Arrow />
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip>
  );
}

function SidebarAvatar({
  avatarUrl,
  userName,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const displayName = userName?.trim() || 'م';
  const initials = displayName.charAt(0).toUpperCase();
  const src = resolveMediaUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <Avatar size="md" className="size-full">
      {src && !failed ? (
        <Avatar.Image src={src} alt={userName ?? 'المستخدم'} onError={() => setFailed(true)} />
      ) : null}
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );
}

function itemRowClass(active: boolean) {
  return `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
    active
      ? 'bg-[#f0f0f0] font-medium text-[#1c1c1e] dark:bg-[var(--surface-secondary)] dark:text-[var(--foreground)]'
      : 'font-medium text-[#1c1c1e] hover:bg-[#f0f0f0] dark:text-[var(--foreground)] dark:hover:bg-[var(--surface-secondary)]'
  }`;
}

function collapsedIconClass(active: boolean) {
  return `group relative flex size-10 items-center justify-center rounded-xl transition-colors duration-150 ${
    active
      ? 'bg-[#f0f0f0] text-[#1c1c1e] dark:bg-[var(--surface-secondary)] dark:text-[var(--foreground)]'
      : 'text-[#3a3a3c] hover:bg-[#f0f0f0] dark:text-[var(--muted-foreground)] dark:hover:bg-[var(--surface-secondary)] dark:hover:text-[var(--foreground)]'
  }`;
}

function NavLinkRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={itemRowClass(isActive)}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.65} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function CollapsedNavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <SidebarTooltip label={label}>
      <Link
        href={href}
        className={collapsedIconClass(isActive)}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
      </Link>
    </SidebarTooltip>
  );
}

function NavChildLink({
  child,
  pathname,
}: {
  child: NavChild;
  pathname: string;
}) {
  const isActive = isNavItemActive(pathname, child.href, child.exact);

  return (
    <Link
      href={child.href}
      className={`block rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${
        isActive
          ? 'bg-[#ebebeb] font-medium text-[#1c1c1e] dark:bg-[var(--surface-secondary)] dark:text-[var(--foreground)]'
          : 'text-[#3a3a3c] hover:bg-[#ebebeb] dark:text-[var(--muted-foreground)] dark:hover:bg-[var(--surface-secondary)] dark:hover:text-[var(--foreground)]'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {child.label}
    </Link>
  );
}

function NavGroupRow({
  group,
  pathname,
  open,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = group.icon;
  const groupActive = isNavGroupActive(pathname, group);
  const highlight = open || groupActive;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={itemRowClass(highlight)}
      >
        <Icon size={18} strokeWidth={highlight ? 2 : 1.65} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-start">{group.label}</span>
        <motion.span
          animate={{ rotate: open ? 0 : 90 }}
          transition={{ duration: 0.24, ease: EASE_LIQUID }}
          className="inline-flex shrink-0 text-[#8e8e93]"
        >
          <ChevronDown size={15} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key={`${group.id}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={heightFadeTransition}
            className="overflow-hidden"
          >
            <div className="ms-[1.625rem] mt-0.5 border-s border-[#e5e5ea] ps-3 dark:border-[var(--border)]">
              <motion.div
                className="flex flex-col gap-0.5 py-0.5"
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.045, delayChildren: 0.04 },
                  },
                }}
              >
                {group.children.map((child) => (
                  <motion.div
                    key={child.href}
                    variants={{
                      hidden: { opacity: 0, y: -4 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.2, ease: EASE_LIQUID },
                      },
                    }}
                  >
                    <NavChildLink child={child} pathname={pathname} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function applyGutter(collapsed: boolean) {
  document.documentElement.style.setProperty(
    '--dashboard-sidebar-gutter',
    collapsed ? GUTTER_COLLAPSED : GUTTER_EXPANDED,
  );
}

export function Sidebar({ avatarUrl, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of sidebarNavEntries) {
      if (entry.type === 'group') {
        initial[entry.id] =
          entry.defaultOpen === true || isNavGroupActive(pathname, entry);
      }
    }
    return initial;
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next = stored === '1';
    setCollapsed(next);
    applyGutter(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyGutter(collapsed);
    window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed, ready]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const entry of sidebarNavEntries) {
        if (entry.type === 'group' && isNavGroupActive(pathname, entry)) {
          next[entry.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  const displayName = userName?.trim() || 'المستخدم';
  const FooterIcon = sidebarFooterItem.icon;
  const footerActive = isNavItemActive(pathname, sidebarFooterItem.href);

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-40 hidden flex-col bg-transparent transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-[var(--border)] sm:flex ${
        collapsed ? 'w-[3.75rem] items-center' : 'w-[15.5rem]'
      }`}
      aria-label="التنقل الرئيسي"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div
        className={`flex items-center pt-4 pb-2 ${
          collapsed ? 'flex-col gap-2 px-0' : 'justify-between px-4'
        }`}
      >
        <Link href={APP_BASE} className="flex items-center" aria-label="الرئيسية">
          <Image
            src="/rukny-logo.svg"
            alt="Rukny"
            width={28}
            height={28}
            className="dark:brightness-0 dark:invert"
          />
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex size-8 items-center justify-center rounded-lg text-[#8e8e93] transition-colors hover:bg-[#f0f0f0] hover:text-[#1c1c1e] dark:hover:bg-[var(--surface-secondary)] dark:hover:text-[var(--foreground)]"
          aria-label={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          aria-expanded={!collapsed}
        >
          <motion.span
            key={collapsed ? 'open' : 'close'}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={labelFadeTransition}
            className="inline-flex"
          >
            {collapsed ? (
              <PanelRightOpen size={18} strokeWidth={1.7} />
            ) : (
              <PanelRightClose size={18} strokeWidth={1.7} />
            )}
          </motion.span>
        </button>
      </div>

      <Link
        href={`${APP_BASE}/settings`}
        className={
          collapsed
            ? 'group relative mt-1 flex size-10 items-center justify-center overflow-hidden rounded-full'
            : 'mx-3 mt-1 flex items-center gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-[#f5f5f7] dark:hover:bg-[var(--surface-secondary)]'
        }
        aria-label="الإعدادات والحساب"
      >
        <div
          className={`shrink-0 overflow-hidden rounded-full transition-[width,height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            collapsed ? 'size-9' : 'size-10'
          }`}
        >
          <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
        </div>
        <AnimatePresence initial={false} mode="popLayout">
          {!collapsed ? (
            <motion.div
              key="profile-text"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={labelFadeTransition}
              className="min-w-0 flex-1 overflow-hidden"
            >
              <p className="truncate text-[13px] font-semibold leading-tight text-[#1c1c1e] dark:text-[var(--foreground)]">
                {displayName}
              </p>
              {userEmail ? (
                <p className="mt-0.5 truncate text-[11px] leading-tight text-[#8e8e93]">
                  {userEmail}
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Link>

      <div
        className={`mt-4 flex min-h-0 flex-1 flex-col overflow-hidden ${
          collapsed ? 'items-center px-0' : 'px-3'
        }`}
      >
        <AnimatePresence initial={false}>
          {!collapsed ? (
            <motion.p
              key="menu-label"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={heightFadeTransition}
              className="overflow-hidden px-3 text-[11px] font-semibold tracking-[0.08em] text-[#aeaeb2]"
            >
              MENU
            </motion.p>
          ) : null}
        </AnimatePresence>

        <div className="relative min-h-0 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            {collapsed ? (
              <motion.nav
                key="nav-collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={panelTransition}
                className="flex flex-col items-center gap-1.5"
                aria-label="القائمة الرئيسية"
              >
                {sidebarNavEntries.map((entry) => {
                  if (entry.type === 'link') {
                    return (
                      <CollapsedNavLink
                        key={entry.href}
                        item={entry}
                        pathname={pathname}
                      />
                    );
                  }

                  const Icon = entry.icon;
                  const active = isNavGroupActive(pathname, entry);
                  const href = entry.children[0]?.href ?? APP_BASE;

                  return (
                    <SidebarTooltip key={entry.id} label={entry.label}>
                      <Link
                        href={href}
                        className={collapsedIconClass(active)}
                        aria-label={entry.label}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon size={19} strokeWidth={active ? 2 : 1.7} />
                      </Link>
                    </SidebarTooltip>
                  );
                })}
              </motion.nav>
            ) : (
              <motion.nav
                key="nav-expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={panelTransition}
                className="flex flex-col gap-0.5 overflow-y-auto"
                aria-label="القائمة الرئيسية"
              >
                {sidebarNavEntries.map((entry) => {
                  if (entry.type === 'link') {
                    return (
                      <NavLinkRow
                        key={entry.href}
                        item={entry}
                        pathname={pathname}
                      />
                    );
                  }

                  return (
                    <NavGroupRow
                      key={entry.id}
                      group={entry}
                      pathname={pathname}
                      open={openGroups[entry.id] ?? false}
                      onToggle={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [entry.id]: !prev[entry.id],
                        }))
                      }
                    />
                  );
                })}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        className={`shrink-0 pb-4 pt-2 ${collapsed ? 'flex justify-center' : 'px-3'}`}
      >
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.div
              key="footer-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={labelFadeTransition}
            >
              <SidebarTooltip label={sidebarFooterItem.label}>
                <Link
                  href={sidebarFooterItem.href}
                  className={collapsedIconClass(footerActive)}
                  aria-label={sidebarFooterItem.label}
                  aria-current={footerActive ? 'page' : undefined}
                >
                  <FooterIcon size={19} strokeWidth={footerActive ? 2 : 1.7} />
                </Link>
              </SidebarTooltip>
            </motion.div>
          ) : (
            <motion.div
              key="footer-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={labelFadeTransition}
            >
              <Link
                href={sidebarFooterItem.href}
                className={itemRowClass(footerActive)}
                aria-current={footerActive ? 'page' : undefined}
              >
                <FooterIcon
                  size={18}
                  strokeWidth={footerActive ? 2 : 1.65}
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1 truncate">
                  {sidebarFooterItem.label}
                </span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
