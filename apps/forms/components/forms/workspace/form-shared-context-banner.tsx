'use client';

import {
  FORM_TEAM_ROLE_DESCRIPTIONS,
  FORM_TEAM_ROLE_LABELS,
  type FormTeamRole,
} from '@/lib/form-team-api';
import type { FormSharedWorkspace } from '@/lib/forms-api';
import { cn } from '@/lib/utils';

export function FormSharedContextBanner({
  workspace,
  className,
}: {
  workspace: FormSharedWorkspace;
  className?: string;
}) {
  const role = workspace.role as FormTeamRole | undefined;
  const roleLabel = role ? FORM_TEAM_ROLE_LABELS[role] : null;
  const roleDescription = role ? FORM_TEAM_ROLE_DESCRIPTIONS[role] : null;

  return (
    <div
      dir="rtl"
      className={cn(
        'dashboard-card rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/[0.04] px-4 py-3.5 sm:rounded-3xl sm:px-5',
        className,
      )}
    >
      <div className="flex items-start gap-3 sm:gap-3.5">
        <div className="min-w-0 flex-1 text-right">
          <p className="text-sm leading-relaxed text-[var(--foreground)]">
            نموذج مشترك من فريق{' '}
            <span className="font-semibold">{workspace.name}</span>
          </p>
          {roleLabel ? (
            <div className="mt-1.5 flex flex-wrap items-center justify-start gap-x-2 gap-y-1">
              <span className="text-[12px] text-[var(--muted-foreground)]">دورك</span>
              <span className="inline-flex items-center rounded-full bg-[var(--primary)]/12 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                {roleLabel}
              </span>
              {roleDescription ? (
                <span className="text-[12px] leading-relaxed text-[var(--muted-foreground)]">
                  {roleDescription}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
}
