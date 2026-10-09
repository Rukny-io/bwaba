'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, LogOut, Plus, X, type LucideIcon } from 'lucide-react';
import { Dropdown, Header, Label } from '@heroui/react';
import {
  getMobileDockBarItems,
  getMobileDockOverflowNavItems,
  getProductsCatalogNavItem,
  isNavItemActive,
  resolveNavItemLabel,
  type NavItem,
} from '@/components/layout/nav-config';
import {
  MobileDockShell,
  MobileDockPill,
  MobileDockNavLink,
  mobileDockSideButtonClass,
} from '@/components/layout/mobile-dock-primitives';
import { logoutWithNotification } from '@/lib/auth-notify';
import { useSidebarProducts } from '@/hooks/use-sidebar-products';
import { resolveProductHref } from '@/lib/developer-products';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';
import { usesBottomIslandNav } from '@/lib/portal-island-nav';

interface MobileDockProps {
  appId: string;
}

function MoreMenuItem({ item, label }: { item: NavItem; label: string }) {
  const Icon = item.icon;
  return (
    <Dropdown.Item key={item.href} id={item.href} textValue={label}>
      <Dropdown.ItemIndicator />
      <Icon
        size={16}
        strokeWidth={1.9}
        className="shrink-0 text-[var(--muted-foreground)]"
        aria-hidden
      />
      <Label>{label}</Label>
    </Dropdown.Item>
  );
}

function ProductMenuItem({
  id,
  href,
  label,
  icon: Icon,
  external,
}: {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  external: boolean;
}) {
  return (
    <Dropdown.Item key={id} id={id} textValue={label}>
      <Dropdown.ItemIndicator />
      <Icon
        size={16}
        strokeWidth={1.9}
        className="shrink-0 text-[var(--muted-foreground)]"
        aria-hidden
      />
      <Label>{label}</Label>
    </Dropdown.Item>
  );
}

export function MobileDock({ appId }: MobileDockProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { installedProducts, hydrated } = useSidebarProducts();

  const hideDock =
    /\/apps\/\d{16}\/settings(?:\/|$)/.test(pathname) ||
    usesBottomIslandNav(pathname);

  const labels = {
    dashboard: t.sidebar.dashboard,
    keys: t.sidebar.keys,
    products: t.sidebar.products,
    docs: t.sidebar.docs,
    apps: t.sidebar.apps,
    appSettings: t.sidebar.appSettings,
    analytics: t.sidebar.analytics,
    wallet: t.sidebar.wallet,
    help: t.sidebar.help,
    logout: t.sidebar.logout,
    more: t.mobile.more,
  };

  const dockItems = getMobileDockBarItems(appId);
  const overflowNav = getMobileDockOverflowNavItems(appId);
  const catalogItem = getProductsCatalogNavItem(appId);
  const productMeta = (t.products.items ?? {}) as Record<string, { name?: string }>;

  const productEntries = useMemo(() => {
    if (!hydrated) return [];
    return installedProducts
      .map((product) => {
        const href = resolveProductHref(product, appId);
        if (!href) return null;
        return {
          id: `product:${product.id}`,
          href,
          label: productMeta[product.id]?.name ?? product.id,
          icon: product.icon,
          external: Boolean(product.externalHref),
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      href: string;
      label: string;
      icon: LucideIcon;
      external: boolean;
    }>;
  }, [appId, hydrated, installedProducts, productMeta]);

  const appMenuItems = useMemo(() => {
    const items: NavItem[] = [...overflowNav, catalogItem];
    items.push({
      href: '/apps',
      icon: LayoutGrid,
      label: labels.apps,
      exact: true,
    });
    return items;
  }, [catalogItem, labels.apps, overflowNav]);

  const moreKeys = useMemo(() => {
    const keys = new Set<string>([
      ...appMenuItems.map((item) => item.href),
      ...productEntries.map((entry) => entry.id),
      'logout',
    ]);
    return keys;
  }, [appMenuItems, productEntries]);

  const activeMoreKey = useMemo(() => {
    for (const item of appMenuItems) {
      if (isNavItemActive(pathname, item.href, item.exact)) {
        return item.href;
      }
    }
    for (const entry of productEntries) {
      if (!entry.external && isNavItemActive(pathname, entry.href)) {
        return entry.id;
      }
    }
    return null;
  }, [appMenuItems, pathname, productEntries]);

  async function handleLogout() {
    setOpen(false);
    await logoutWithNotification();
  }

  if (hideDock) {
    return null;
  }

  return (
    <MobileDockShell>
      <MobileDockPill aria-label={t.mobile.mainNav}>
        {dockItems.map((item) => {
          const label = resolveNavItemLabel(item.label, labels);
          const active = isNavItemActive(pathname, item.href, item.exact);
          return (
            <MobileDockNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={label}
              isActive={active}
            />
          );
        })}
      </MobileDockPill>

      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <Dropdown.Trigger
          aria-label={open ? t.mobile.closeMoreSections : t.mobile.openMoreSections}
          className={cn(
            mobileDockSideButtonClass,
            open || activeMoreKey
              ? 'bg-[var(--foreground)] text-[var(--background)] hover:text-[var(--background)]'
              : undefined,
          )}
        >
          {open ? (
            <X size={19} strokeWidth={2.2} aria-hidden />
          ) : (
            <Plus size={20} strokeWidth={2.1} aria-hidden />
          )}
        </Dropdown.Trigger>
        <Dropdown.Popover
          placement="top"
          className="min-w-[16rem] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--field-background)]"
        >
          <Dropdown.Menu
            selectedKeys={activeMoreKey ? new Set([activeMoreKey]) : new Set()}
            selectionMode="single"
            onAction={(key) => {
              const id = String(key);
              if (id === 'logout') {
                void handleLogout();
                return;
              }
              if (!moreKeys.has(id)) return;

              const product = productEntries.find((entry) => entry.id === id);
              if (product) {
                setOpen(false);
                if (product.external) {
                  window.open(product.href, '_blank', 'noopener,noreferrer');
                  return;
                }
                router.push(product.href);
                return;
              }

              const nav = appMenuItems.find((item) => item.href === id);
              if (nav) {
                setOpen(false);
                router.push(nav.href);
              }
            }}
          >
            {productEntries.length > 0 ? (
              <Dropdown.Section>
                <Header>{t.products.mobileDrawerProducts}</Header>
                {productEntries.map((entry) => (
                  <ProductMenuItem
                    key={entry.id}
                    id={entry.id}
                    href={entry.href}
                    label={entry.label}
                    icon={entry.icon}
                    external={entry.external}
                  />
                ))}
              </Dropdown.Section>
            ) : null}
            <Dropdown.Section>
              {appMenuItems.map((item) => (
                <MoreMenuItem
                  key={item.href}
                  item={item}
                  label={resolveNavItemLabel(item.label, labels)}
                />
              ))}
            </Dropdown.Section>
            <Dropdown.Section>
              <Dropdown.Item id="logout" textValue={labels.logout} variant="danger">
                <LogOut
                  size={16}
                  strokeWidth={1.9}
                  className="shrink-0"
                  aria-hidden
                />
                <Label>{labels.logout}</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </MobileDockShell>
  );
}
