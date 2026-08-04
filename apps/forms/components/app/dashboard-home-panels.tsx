import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Inbox,
  PencilLine,
  Plus,
  Sparkles,
} from 'lucide-react';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import type {
  DashboardActivityItem,
} from '@/lib/forms-dashboard-data';
import type { FormListItem } from '@/lib/forms-api';
import {
  FORM_STATUS_CONFIG,
  FORM_STATUS_LABELS,
  FORM_TYPE_LABELS,
  formatFormDate,
} from '@/lib/forms-format';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';
import { formatRelativeTime } from '@/lib/integrations-format';
import { cn } from '@/lib/utils';

function PanelHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
      <h2 className="text-sm font-semibold text-[var(--foreground)] sm:text-[15px]">
        {title}
      </h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)] transition-opacity hover:opacity-80"
      >
        {linkLabel}
        <ArrowLeft size={12} strokeWidth={2} />
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
  icon: typeof FileText;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon size={18} strokeWidth={1.7} />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="max-w-[16rem] text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
        >
          <Plus size={13} strokeWidth={2.2} />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function formSubmissionCount(form: FormListItem): number {
  return form.submissionCount ?? form._count?.submissions ?? 0;
}

function activityIcon(type: string) {
  if (type === 'form_submission') return Inbox;
  if (type === 'form_created') return Sparkles;
  return PencilLine;
}

const HOME_PANEL_LIMIT = 3;

export function DashboardHomeRecentForms({ forms }: { forms: FormListItem[] }) {
  const items = forms.slice(0, HOME_PANEL_LIMIT);
  return (
    <DashboardSurface padding="md" className="h-full">
      <PanelHeader
        title="نماذج حديثة"
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
        <ul className="divide-y divide-[var(--separator)]">
          {items.map((form) => {
            const status = FORM_STATUS_CONFIG[form.status];
            const count = formSubmissionCount(form);
            return (
              <li key={form.id}>
                <Link
                  href={`/app/forms/${form.id}`}
                  className="group flex items-start gap-3 py-2"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--surface-tertiary)]">
                    <FileText size={16} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                          status.bg,
                          status.color,
                        )}
                      >
                        {FORM_STATUS_LABELS[form.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted-foreground)]">
                      {FORM_TYPE_LABELS[form.type]}
                      <span className="mx-1.5 text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {count} رد
                      </span>
                      <span className="mx-1.5 text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {formatFormDate(form.updatedAt)}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSurface>
  );
}

export function DashboardHomeRecentSubmissions({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);
  return (
    <DashboardSurface padding="md" className="h-full">
      <PanelHeader
        title="آخر الاستجابات"
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
        <ul className="divide-y divide-[var(--separator)]">
          {list.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-start gap-3 py-2"
              >
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--surface-tertiary)]">
                  <Inbox size={16} strokeWidth={1.7} />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                    {item.description || item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted-foreground)]">
                    {item.title}
                    <span className="mx-1.5 text-[var(--border)]">·</span>
                    <span dir="ltr" lang="en">
                      {formatRelativeTime(item.createdAt) ??
                        formatFormDate(item.createdAt)}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardSurface>
  );
}

export function DashboardHomeActivity({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);
  return (
    <DashboardSurface padding="md" className="h-full">
      <PanelHeader
        title="نشاط مختصر"
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
        <ul className="divide-y divide-[var(--separator)]">
          {list.map((item) => {
            const Icon = activityIcon(item.type);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-start gap-3 py-2"
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--surface-tertiary)]">
                    <Icon size={16} strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted-foreground)]">
                      {item.description}
                      <span className="mx-1.5 text-[var(--border)]">·</span>
                      <span dir="ltr" lang="en">
                        {formatRelativeTime(item.createdAt) ??
                          formatFormDate(item.createdAt)}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSurface>
  );
}
