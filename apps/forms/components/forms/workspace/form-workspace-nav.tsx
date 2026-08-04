'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
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
  FORM_WORKSPACE_TABS,
  isFormWorkspacePathTabActive,
} from '@/lib/form-workspace-tabs';
import {
  formWorkspaceTabClassName,
  formWorkspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

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
  const visibleTabs = FORM_WORKSPACE_TABS.filter((tab) =>
    canAccessFormWorkspaceTab(accessRole, tab.suffix),
  );

  return (
    <header className="space-y-4 sm:space-y-5">
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
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {formTitle?.trim() || 'تفاصيل النموذج'}
          </h1>
          {isShared ? (
            <p className="mt-1 text-[11px] font-medium text-[var(--primary)]">
              نموذج مشترك عبر الفريق
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              إعدادات النموذج، الاستجابات، التحليلات والتكاملات
            </p>
          )}
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
          const active = isFormWorkspacePathTabActive(
            pathname,
            formId,
            tab.suffix,
          );
          const Icon = tab.icon;
          const countBadge =
            tab.showCount && submissionCount > 0 ? submissionCount : null;

          return (
            <Link
              key={tab.suffix || 'settings'}
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
