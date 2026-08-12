'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, X, LayoutGrid, LogOut, Plus, type LucideIcon } from 'lucide-react';
import {
  getMobileDockItems,
  getProductsCatalogNavItem,
  isNavItemActive,
  resolveNavItemLabel,
} from '@/components/layout/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockItem,
  MobileDockFab,
} from '@/components/layout/mobile-dock-primitives';
import { logoutWithNotification } from '@/lib/auth-notify';
import { useSidebarProducts } from '@/hooks/use-sidebar-products';
import {
  resolveProductHref,
  type DeveloperProduct,
} from '@/lib/developer-products';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

interface MobileDockProps {
  appId: string;
}

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

function MobilePinnedProductRow({
  product,
  appId,
  label,
  pathname,
  onNavigate,
}: {
  product: DeveloperProduct;
  appId: string;
  label: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const href = resolveProductHref(product, appId);
  if (!href) return null;

  const isExternal = Boolean(product.externalHref);
  const active = !isExternal && isNavItemActive(pathname, href);
  const Icon = product.icon;

  const content = (
    <>
      <DrawerIcon icon={Icon} active={active} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
        {label}
      </span>
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={drawerRowClass(false)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onNavigate} className={drawerRowClass(active)}>
      {content}
    </Link>
  );
}

export function MobileDock({ appId }: MobileDockProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => setOpen(false), []);

  if (/\/apps\/\d{16}\/settings(?:\/|$)/.test(pathname)) {
    return null;
  }

  const isRtl = t.common.switchLang === 'English';
  const labels = {
    dashboard: t.sidebar.dashboard,
    keys: t.sidebar.keys,
    products: t.sidebar.products,
    docs: t.sidebar.docs,
    apps: t.sidebar.apps,
    appSettings: t.sidebar.appSettings,
    analytics: t.sidebar.analytics,
    help: t.sidebar.help,
    logout: t.sidebar.logout,
    more: t.mobile.more,
  };

  const dockItems = getMobileDockItems(appId);
  const catalogItem = getProductsCatalogNavItem(appId);
  const { installedProducts, hydrated } = useSidebarProducts();
  const productMeta = (t.products.items ?? {}) as Record<string, { name?: string }>;
  const catalogActive = isNavItemActive(pathname, catalogItem.href);
  const hasProducts = hydrated && installedProducts.length > 0;

  async function handleLogout() {
    setOpen(false);
    await logoutWithNotification();
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label={t.mobile.closeMenu}
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
          dir={isRtl ? 'rtl' : 'ltr'}
          role="menu"
          aria-label={labels.more}
          className="fixed inset-x-0 bottom-[5.5rem] z-50 mx-auto flex max-h-[min(52vh,22rem)] w-[min(100%-2rem,18.5rem)] flex-col overflow-hidden rounded-2xl bg-[var(--surface)]/96 backdrop-blur-xl sm:hidden"
        >
          <div className="max-h-[inherit] overflow-y-auto overscroll-contain px-1.5 py-1.5">
            {hasProducts ? (
              <div className="px-1.5 pb-1 pt-1.5">
                <p className="px-1.5 pb-1 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">
                  {t.products.mobileDrawerProducts}
                </p>
                <div className="flex flex-col gap-0.5">
                  {installedProducts.map((product) => (
                    <MobilePinnedProductRow
                      key={product.id}
                      product={product}
                      appId={appId}
                      label={productMeta[product.id]?.name ?? product.id}
                      pathname={pathname}
                      onNavigate={handleClose}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className={cn(
                'flex flex-col gap-0.5 px-1.5',
                hasProducts && 'mt-0.5 border-t border-[var(--border)]/50 pt-1.5',
              )}
            >
              {!hasProducts ? (
                <p className="px-1.5 pb-1 pt-1 text-[10px] font-semibold tracking-wide text-[var(--muted-foreground)]">
                  {labels.more}
                </p>
              ) : null}
              <Link
                href={catalogItem.href}
                onClick={handleClose}
                className={drawerRowClass(catalogActive)}
              >
                <DrawerIcon icon={Plus} active={catalogActive} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
                  {t.products.addProduct}
                </span>
              </Link>
              <Link
                href="/apps"
                onClick={handleClose}
                className={drawerRowClass(pathname === '/apps')}
              >
                <DrawerIcon
                  icon={LayoutGrid}
                  active={pathname === '/apps'}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
                  {t.topbar.myApps}
                </span>
              </Link>
            </div>

            <div className="mt-0.5 border-t border-[var(--border)]/50 px-1.5 pb-0.5 pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
              >
                <DrawerIcon icon={LogOut} danger />
                <span className="text-[13px] font-medium">{labels.logout}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <MobileDockShell>
        <MobileDockPill
          aria-label={t.mobile.mainNav}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {dockItems.map(({ href, icon, label, exact }) => (
            <MobileDockItem
              key={href}
              href={href}
              icon={icon}
              label={resolveNavItemLabel(label, labels)}
              isActive={isNavItemActive(pathname, href, exact)}
            />
          ))}
          <MobileDockItem
            icon={open ? X : MoreHorizontal}
            label={labels.more}
            isActive={open}
            showLabel={false}
            onClick={() => setOpen((value) => !value)}
          />
        </MobileDockPill>

        <MobileDockFab
          href={catalogItem.href}
          label={t.products.addProduct}
          icon={Plus}
        />
      </MobileDockShell>
    </>
  );
}
