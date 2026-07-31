'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal, X, LayoutGrid, LogOut, Plus } from 'lucide-react';
import {
  getMobileDockItems,
  getProductsCatalogNavItem,
  isNavItemActive,
  resolveNavItemLabel,
} from '@/components/layout/nav-config';
import { logoutWithNotification } from '@/lib/auth-notify';
import { useSidebarProducts } from '@/hooks/use-sidebar-products';
import {
  resolveProductHref,
  type DeveloperProduct,
} from '@/lib/developer-products';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

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

interface MobileDockProps {
  appId: string;
}

function drawerRowClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors',
    active ? 'bg-[var(--surface-secondary)]' : 'hover:bg-[var(--surface-secondary)]',
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
      <Icon size={18} strokeWidth={1.8} />
      {label}
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

  const isRtl = t.common.switchLang === 'English';
  const labels = {
    dashboard: t.sidebar.dashboard,
    keys: t.sidebar.keys,
    products: t.sidebar.products,
    docs: t.sidebar.docs,
    apps: t.sidebar.apps,
    appSettings: t.sidebar.appSettings,
    help: t.sidebar.help,
    logout: t.sidebar.logout,
    more: t.mobile.more,
  };

  const dockItems = getMobileDockItems(appId);
  const catalogItem = getProductsCatalogNavItem(appId);
  const { installedProducts, hydrated } = useSidebarProducts();
  const productMeta = (t.products.items ?? {}) as Record<string, { name?: string }>;
  const catalogActive = isNavItemActive(pathname, catalogItem.href);

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
          className="mobile-dock-backdrop fixed inset-0 z-40 sm:hidden"
          onClick={handleClose}
        />
      ) : null}

      {open ? (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="mobile-dock-drawer fixed inset-x-3 bottom-[5.2rem] z-50 flex max-h-[65vh] flex-col gap-0.5 overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-2xl backdrop-blur-[40px] sm:hidden"
        >
          {hydrated && installedProducts.length > 0 ? (
            <>
              <p className="px-3 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {t.products.mobileDrawerProducts}
              </p>
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
              <div className="mx-1 my-1 h-px bg-[var(--border)]" />
            </>
          ) : null}

          <Link
            href={catalogItem.href}
            onClick={handleClose}
            className={drawerRowClass(catalogActive)}
          >
            <Plus size={18} strokeWidth={1.8} />
            {t.products.addProduct}
          </Link>
          <Link
            href="/apps"
            onClick={handleClose}
            className={drawerRowClass(pathname === '/apps')}
          >
            <LayoutGrid size={18} strokeWidth={1.8} />
            {t.topbar.myApps}
          </Link>

          <div className="mx-1 my-1 h-px bg-[var(--border)]" />

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--background))]"
          >
            <LogOut size={16} />
            {labels.logout}
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
        <div className="pointer-events-auto relative mb-3 flex justify-center">
          <nav
            dir={isRtl ? 'rtl' : 'ltr'}
            aria-label={t.mobile.mainNav}
            className="flex items-center gap-0.5 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/95 px-[5px] py-1 shadow-xl backdrop-blur-[32px]"
          >
            {dockItems.map(({ href, icon, label, exact }) => (
              <DockButton
                key={href}
                href={href}
                icon={icon}
                label={resolveNavItemLabel(label, labels)}
                isActive={isNavItemActive(pathname, href, exact)}
              />
            ))}
            <div className="mx-0.5 h-4 w-px shrink-0 rounded-[1px] bg-[var(--border)]" />
            <DockButton
              icon={open ? X : MoreHorizontal}
              label={labels.more}
              isActive={open}
              onClick={() => setOpen((value) => !value)}
            />
          </nav>
        </div>
      </div>
    </>
  );
}
