import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  FileText,
  Inbox,
  PencilLine,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardActivityItem } from '@/lib/forms-dashboard-data';
import type { FormListItem } from '@/lib/forms-api';
import {
  FORM_STATUS_LABELS,
  FORM_TYPE_LABELS,
  formatFormDate,
} from '@/lib/forms-format';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';
import { formatRelativeTime } from '@/lib/integrations-format';
import { cn } from '@/lib/utils';

const HOME_PANEL_LIMIT = 3;

const STATUS_PILL: Record<FormListItem['status'], string> = {
  DRAFT:
    'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/70',
  PUBLISHED:
    'bg-[var(--brand-soft-lime)] text-[var(--primary-foreground)] ring-1 ring-[color-mix(in_srgb,var(--brand-lime)_35%,transparent)] dark:text-[var(--brand-lime)]',
  CLOSED:
    'bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] text-[var(--warning)] ring-1 ring-[color-mix(in_srgb,var(--warning)_30%,transparent)]',
  ARCHIVED:
    'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/50',
};

function PanelShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'dashboard-card flex h-full flex-col rounded-[1.75rem] border-[var(--border)] p-4 sm:rounded-[2rem] sm:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  title,
  icon: Icon,
  href,
  linkLabel,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3 sm:mb-4">
      <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--surface-secondary)] py-1 pe-3 ps-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--brand-carbon)] shadow-[0_1px_3px_rgba(67,71,56,0.06)] ring-1 ring-[var(--border)]/40 dark:text-[var(--foreground)]">
          <Icon size={14} strokeWidth={1.9} aria-hidden />
        </span>
        <h2 className="truncate text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
      >
        {linkLabel}
        <ArrowLeft size={12} strokeWidth={2.2} aria-hidden />
      </Link>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-2xl bg-[var(--surface-secondary)]/60 px-4 py-9 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]/50">
        <Icon size={18} strokeWidth={1.7} aria-hidden />
      </div>
      <p className="text-[13px] font-semibold text-[var(--foreground)]">{title}</p>
      <p className="max-w-[15rem] text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3.5 py-2 text-[12px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          <Plus size={13} strokeWidth={2.2} aria-hidden />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function formSubmissionCount(form: FormListItem): number {
  return form.submissionCount ?? form._count?.submissions ?? 0;
}

function activityIcon(type: string): LucideIcon {
  if (type === 'form_submission') return Inbox;
  if (type === 'form_created') return Sparkles;
  return PencilLine;
}

function ListRow({
  href,
  icon: Icon,
  title,
  meta,
  trailing,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft-lime)] text-[var(--brand-carbon)] ring-1 ring-[color-mix(in_srgb,var(--brand-lime)_28%,transparent)] transition-transform group-hover:scale-[1.03] dark:text-[var(--foreground)]">
        <Icon size={15} strokeWidth={1.85} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
            {title}
          </p>
          {trailing}
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {meta}
        </div>
      </div>
    </Link>
  );
}

export function DashboardHomeRecentForms({ forms }: { forms: FormListItem[] }) {
  const items = forms.slice(0, HOME_PANEL_LIMIT);
  return (
    <PanelShell>
      <PanelHeader
        title="نماذج حديثة"
        icon={FileText}
        href="/app/forms"
        linkLabel="كل النماذج"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="لا توجد نماذج بعد"
          description="أنشئ أول نموذج وابدأ بجمع الاستجابات."
          actionHref={FORMS_CREATE_ENTRY_PATH}
          actionLabel="إنشاء نموذج"
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {items.map((form) => {
            const count = formSubmissionCount(form);
            return (
              <li key={form.id}>
                <ListRow
                  href={`/app/forms/${form.id}`}
                  icon={FileText}
                  title={form.title}
                  trailing={
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        STATUS_PILL[form.status],
                      )}
                    >
                      {FORM_STATUS_LABELS[form.status]}
                    </span>
                  }
                  meta={
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span>{FORM_TYPE_LABELS[form.type]}</span>
                      <span className="text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {count} رد
                      </span>
                      <span className="text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {formatFormDate(form.updatedAt)}
                      </span>
                    </span>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}

export function DashboardHomeRecentSubmissions({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);
  return (
    <PanelShell>
      <PanelHeader
        title="آخر الاستجابات"
        icon={Inbox}
        href="/app/forms"
        linkLabel="النماذج"
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="لا استجابات بعد"
          description="عند وصول ردود جديدة ستظهر هنا مباشرة."
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {list.map((item) => (
            <li key={item.id}>
              <ListRow
                href={item.href}
                icon={Inbox}
                title={item.description || item.title}
                meta={
                  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="text-[var(--border)]">·</span>
                    <span dir="ltr" lang="en">
                      {formatRelativeTime(item.createdAt) ??
                        formatFormDate(item.createdAt)}
                    </span>
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function DashboardHomeActivity({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);
  return (
    <PanelShell>
      <PanelHeader
        title="نشاط مختصر"
        icon={Sparkles}
        href="/app/notifications"
        linkLabel="الإشعارات"
      />

      {list.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="لا نشاط حديث"
          description="إنشاء النماذج وتعديلها والاستجابات ستُعرض هنا."
          actionHref={FORMS_CREATE_ENTRY_PATH}
          actionLabel="إنشاء نموذج"
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {list.map((item) => {
            const Icon = activityIcon(item.type);
            return (
              <li key={item.id}>
                <ListRow
                  href={item.href}
                  icon={Icon}
                  title={item.title}
                  meta={
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="line-clamp-1">{item.description}</span>
                      <span className="text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {formatRelativeTime(item.createdAt) ??
                          formatFormDate(item.createdAt)}
                      </span>
                    </span>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </PanelShell>
  );
}
