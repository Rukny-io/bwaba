'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  ChevronLeft,
  Inbox,
  Plug,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { OpenFormEditorButton } from '@/components/forms/shared/open-form-editor-button';
import type { FormStatus } from '@/lib/forms-api';
import { FormStatusChip } from '@/components/forms/shared/form-status-chip';
import {
  canAccessFormWorkspaceTab,
  hasFormTeamPermission,
  type FormAccessRole,
} from '@/lib/form-team-permissions';
import type { FormTeamRole } from '@/lib/form-team-api';
import {
  formWorkspaceTabClassName,
  formWorkspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const TABS: {
  suffix: string;
  label: string;
  icon: LucideIcon;
  showCount?: boolean;
}[] = [
  {
    suffix: '',
    label: 'إعدادات',
    icon: Settings,
  },
  {
    suffix: '/submissions',
    label: 'الاستجابات',
    icon: Inbox,
    showCount: true,
  },
  {
    suffix: '/analytics',
    label: 'التحليلات',
    icon: BarChart2,
  },
  {
    suffix: '/integrations',
    label: 'التكاملات',
    icon: Plug,
  },
];

function isTabActive(pathname: string, base: string, suffix: string): boolean {
  const href = `${base}${suffix}`;
  if (suffix === '') {
    return pathname === base;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

export function FormWorkspaceNav({
  formId,
  formSlug,
  formTitle,
  formStatus,
  submissionCount = 0,
  isShared = false,
  sharedRole,
}: {
  formId: string;
  formSlug?: string | null;
  formTitle?: string | null;
  formStatus?: FormStatus | null;
  submissionCount?: number;
  isShared?: boolean;
  sharedRole?: FormTeamRole | string | null;
}) {
  const pathname = usePathname();
  const base = `/app/forms/${formId}`;
  const accessRole = resolveNavAccessRole(isShared, sharedRole);
  const visibleTabs = TABS.filter((tab) =>
    canAccessFormWorkspaceTab(accessRole, tab.suffix),
  );

  return (
    <header className="dashboard-page mb-5 space-y-4 sm:mb-6 sm:space-y-5 sm:pt-0">
      <div className="flex items-start justify-between gap-3">
        <Link
          href="/app/forms"
          className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
          نماذجي
        </Link>
        {formStatus ? (
          <FormStatusChip status={formStatus} className="shrink-0" />
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-center sm:text-start">
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {formTitle?.trim() || 'تفاصيل النموذج'}
          </h1>
          {isShared ? (
            <p className="mt-1 text-[11px] font-medium text-[var(--primary)]">
              نموذج مشترك عبر الفريق
            </p>
          ) : null}
        </div>
        {formSlug && hasFormTeamPermission(accessRole, 'edit_form') ? (
          <div className="w-full sm:w-auto">
            <OpenFormEditorButton formSlug={formSlug} fullWidth />
          </div>
        ) : null}
      </div>

      <nav
        className={cn(formWorkspaceTabGroupClassName, 'max-sm:hidden')}
        aria-label="أقسام النموذج"
      >
        {visibleTabs.map((tab) => {
          const href = `${base}${tab.suffix}`;
          const active = isTabActive(pathname, base, tab.suffix);
          const Icon = tab.icon;
          const countBadge =
            tab.showCount && submissionCount > 0 ? submissionCount : null;

          return (
            <Link
              key={tab.suffix}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={formWorkspaceTabClassName(active)}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span>{tab.label}</span>
              {countBadge != null ? (
                <span
                  className={cn(
                    'inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                    active
                      ? 'bg-[var(--background)]/20 text-[var(--background)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                  )}
                  dir="ltr"
                  lang="en"
                >
                  {countBadge > 999 ? '999+' : countBadge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
