'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  Inbox,
  LayoutGrid,
  Plug,
  Settings,
} from 'lucide-react';
import { APP_BASE } from '@/components/app/nav-config';
import {
  canAccessFormWorkspaceTab,
  type FormAccessRole,
} from '@/lib/form-team-permissions';
import type { FormTeamRole } from '@/lib/form-team-api';
import { cn } from '@/lib/utils';

const FORM_TABS = [
  { suffix: '', label: 'إعدادات', icon: Settings },
  { suffix: '/submissions', label: 'الاستجابات', icon: Inbox },
  { suffix: '/analytics', label: 'التحليلات', icon: BarChart2 },
  { suffix: '/integrations', label: 'التكاملات', icon: Plug },
] as const;

function resolveNavAccessRole(
  isShared: boolean,
  sharedRole?: string | null,
): FormAccessRole {
  if (!isShared) return 'OWNER';
  if (
    sharedRole === 'ADMIN' ||
    sharedRole === 'EDITOR' ||
    sharedRole === 'ANALYST' ||
    sharedRole === 'VIEWER'
  ) {
    return sharedRole;
  }
  return 'VIEWER';
}

function isFormTabActive(pathname: string, base: string, suffix: string) {
  const href = `${base}${suffix}`;
  if (suffix === '') return pathname === base;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DockTab({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
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
      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} style={{ flexShrink: 0 }} />
      {isActive ? (
        <span className="inline-block whitespace-nowrap text-[12px] font-bold tracking-tight">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

export function FormWorkspaceMobileDock({
  formId,
  isShared = false,
  sharedRole,
}: {
  formId: string;
  isShared?: boolean;
  sharedRole?: FormTeamRole | string | null;
}) {
  const pathname = usePathname();
  const base = `${APP_BASE}/forms/${formId}`;
  const accessRole = resolveNavAccessRole(isShared, sharedRole);
  const visibleTabs = FORM_TABS.filter((tab) =>
    canAccessFormWorkspaceTab(accessRole, tab.suffix),
  );

  return (
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
      <div className="pointer-events-auto relative mb-3 flex justify-center px-2">
        <nav
          dir="rtl"
          aria-label="أقسام النموذج"
          className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[26px] border border-[var(--border)] bg-[var(--surface)]/95 px-[5px] py-1 shadow-xl backdrop-blur-[32px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleTabs.map(({ suffix, label, icon }) => (
            <DockTab
              key={suffix}
              href={`${base}${suffix}`}
              icon={icon}
              label={label}
              isActive={isFormTabActive(pathname, base, suffix)}
            />
          ))}
          <div className="mx-0.5 h-4 w-px shrink-0 rounded-[1px] bg-[var(--border)]" />
          <DockTab
            href={`${APP_BASE}/forms`}
            icon={LayoutGrid}
            label="نماذجي"
            isActive={false}
          />
        </nav>
      </div>
    </div>
  );
}
