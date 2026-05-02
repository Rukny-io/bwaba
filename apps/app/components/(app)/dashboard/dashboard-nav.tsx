'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, MessageCircle, ChevronLeft } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Breadcrumb helpers                                                 */
/* ------------------------------------------------------------------ */

const labelMap: Record<string, string> = {
  app: 'لوحة التحكم',
  orders: 'الطلبات',
  analytics: 'الإحصاءات',
  store: 'المتجر',
  products: 'المنتجات',
  categories: 'التصنيفات',
  team: 'الفريق',
  schedule: 'الجدول',
  settings: 'الإعدادات',
  help: 'المساعدة',
  new: 'جديد',
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  return segments.map((seg, i) => ({
    label: labelMap[seg] ?? seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));
}

function getParentInfo(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const parentSegments = segments.slice(0, -1);
  if (parentSegments.length === 0) return null;
  const parentSlug = parentSegments[parentSegments.length - 1];
  return {
    label: labelMap[parentSlug] ?? parentSlug,
    href: '/' + parentSegments.join('/'),
  };
}

/* ------------------------------------------------------------------ */
/*  DashboardNav                                                       */
/* ------------------------------------------------------------------ */

export function DashboardNav() {
  const pathname = usePathname();
  const breadcrumbs = buildBreadcrumbs(pathname);
  const parent = getParentInfo(pathname);

  return (
    <header className="absolute top-0 inset-x-0 z-20 pointer-events-none">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1.5 pointer-events-auto">

        {/* يمين (RTL): Breadcrumbs */}
        <nav
          className="flex items-center gap-1.5 bg-white/80 dark:bg-[var(--surface)]/80 backdrop-blur-2xl rounded-4xl border border-[var(--border)]/40 px-4 py-2"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <ChevronLeft className="size-3 text-[var(--muted)] shrink-0" aria-hidden />
              )}
              {crumb.isLast ? (
                <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* يسار (RTL): أيقونات الإجراءات */}
        <div className="flex items-center gap-1.5 bg-white/80 dark:bg-[var(--surface)]/80 backdrop-blur-2xl rounded-4xl border border-[var(--border)]/40 px-2 py-1.5">

          {/* Messages */}
          <button
            className="relative w-9 h-9 rounded-3xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-all"
            aria-label="الرسائل"
          >
            <MessageCircle size={17} strokeWidth={1.7} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          </button>

          {/* Notifications */}
          <button
            className="relative w-9 h-9 rounded-3xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-all"
            aria-label="الإشعارات"
          >
            <Bell size={17} strokeWidth={1.7} />
          </button>

        </div>
      </div>
    </header>
  );
}
