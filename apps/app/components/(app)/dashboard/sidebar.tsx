'use client';

/**
 * 🧭 Sidebar Navigation
 * شريط تنقل جانبي — تصميم محسّن مع pill ومؤشر نشط
 */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Link2,
  Palette,
  Store,
  Settings,
  HelpCircle,
  LogOut,
  ShoppingBag,
  PackageSearch,
  BarChart2,
  Truck,
  ShoppingCart,
} from 'lucide-react';
import { Dropdown } from '@heroui/react';

/* ── Navigation Items ── */

const mainNavItems = [
  { href: '/app', icon: LayoutGrid, label: 'لوحة التحكم' },
  { href: '/app/links', icon: Link2, label: 'الروابط' },
  { href: '/app/customize', icon: Palette, label: 'التخصيص' },
  { href: '/app/settings', icon: Settings, label: 'الإعدادات' },
  { href: '/app/help', icon: HelpCircle, label: 'المساعدة' },
];

const storeSubItems = [
  { href: '/app/store', icon: Store, label: 'المتجر' },
  { href: '/app/orders', icon: ShoppingCart, label: 'الطلبات' },
  { href: '/app/products', icon: PackageSearch, label: 'المنتجات' },
  { href: '/app/analytics', icon: BarChart2, label: 'التحليلات' },
  { href: '/app/shipping', icon: Truck, label: 'التوصيل والشحن' },
];

const storeHrefs = storeSubItems.map((i) => i.href);

/* ── Tooltip ── */

function Tooltip({ label }: { label: string }) {
  return (
    <span className="
      pointer-events-none absolute left-0 -translate-x-[calc(100%+10px)] top-1/2 -translate-y-1/2
      bg-[var(--foreground)] text-[var(--background)] text-xs font-medium px-2.5 py-1.5 rounded-xl whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg
      after:content-[''] after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2
      after:border-4 after:border-transparent after:border-l-[var(--foreground)]
    ">
      {label}
    </span>
  );
}

/* ── Nav Button Styles ── */

function getNavClasses(isActive: boolean) {
  return `relative group w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
    isActive
      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-md shadow-[var(--foreground)]/10'
      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
  }`;
}

/* ── Separator ── */

function NavSeparator() {
  return <div className="w-5 h-px bg-[var(--border)] my-0.5" />;
}

/* ── Props ── */

interface SidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

/* ── Component ── */

export function Sidebar({ avatarUrl, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isStoreActive = storeHrefs.some((h) => pathname === h || pathname.startsWith(h + '/'));

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="hidden sm:flex fixed right-4 top-0 h-full flex-col items-center py-5 z-40 w-14">

      {/* الشعار */}
      <div className="mb-5 flex items-center justify-center w-10 h-10">
        <Image src="/rukny-logo.svg" alt="Rukny" width={36} height={36} className="dark:invert" />
      </div>

      {/* Pill — أيقونات التنقل */}
      <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center bg-[var(--surface)] rounded-[28px] px-2 py-4 border border-[var(--border)] shadow-sm">
        <nav className="flex flex-col gap-1 items-center">

          {/* لوحة التحكم + الروابط + التخصيص */}
          {mainNavItems.slice(0, 3).map(({ href, icon: Icon, label }) => {
            const isActive = href === '/app' ? pathname === '/app' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={getNavClasses(isActive)}
              >
                <Icon size={18} strokeWidth={1.7} />
                <Tooltip label={label} />
              </Link>
            );
          })}

          <NavSeparator />

          {/* المتجر — Dropdown */}
          <Dropdown>
            <Dropdown.Trigger
              className={`${getNavClasses(isStoreActive)} outline-none `}
            >
              <ShoppingBag size={18} strokeWidth={1.7} />
              <Tooltip label="المتجر" />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="left" className="[direction:rtl]">
              <Dropdown.Menu
                aria-label="خيارات المتجر"
                onAction={(key) => router.push(key as string)}
              >
                {storeSubItems.map(({ href, icon: Icon, label }) => (
                  <Dropdown.Item key={href} id={href} textValue={label}>
                    <div className="flex items-center gap-2">
                      <Icon size={15} strokeWidth={1.7} />
                      <span>{label}</span>
                    </div>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <NavSeparator />

          {/* الإعدادات + المساعدة */}
          {mainNavItems.slice(3).map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={getNavClasses(isActive)}
              >
                <Icon size={18} strokeWidth={1.7} />
                <Tooltip label={label} />
              </Link>
            );
          })}

        </nav>
      </div>
      </div>

      {/* القسم السفلي: Avatar + Logout */}
      <div className="flex flex-col items-center gap-2">

        {/* تسجيل الخروج */}
        <button
          onClick={handleLogout}
          className="relative group w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
        >
          <LogOut size={18} strokeWidth={1.7} />
          <Tooltip label="تسجيل الخروج" />
        </button>

        {/* صورة المستخدم */}
        <Link
          href="/app/settings"
          className="group relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[var(--border)] hover:ring-[var(--accent)] transition-all duration-200"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName ?? 'المستخدم'}
              width={40}
              height={40}
              loading="eager"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--accent)] to-[var(--foreground)] flex items-center justify-center text-[var(--background)] font-semibold text-sm">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </Link>
      </div>

    </aside>
  );
}
