import Link from 'next/link';
import {
  Calendar,
  FileText,
  Sparkles,
  Store,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityItem } from '@/lib/types/admin';
import {
  activityDetailHref,
  activityTypeLabel,
} from '@/lib/activity-paths';
import { formatRelativeTime } from '@/lib/dashboard-format';
import { resolveMediaUrl } from '@/lib/media-url';
import { APP_BASE } from '@/components/layout/nav-config';

const TYPE_ICONS: Record<ActivityItem['type'], LucideIcon> = {
  user_signup: UserPlus,
  store_created: Store,
  form_created: FileText,
  event_created: Calendar,
};

const HOME_ACTIVITY_LIMIT = 8;

function ActivityAvatar({
  avatar,
  title,
  type,
}: {
  avatar?: string;
  title: string;
  type: ActivityItem['type'];
}) {
  const Icon = TYPE_ICONS[type];
  const src = avatar ? resolveMediaUrl(avatar) : null;

  return (
    <span className="relative flex size-9 shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]/50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-[var(--primary)]">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
      )}
    </span>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const href = activityDetailHref(item);
  const content = (
    <>
      <ActivityAvatar avatar={item.avatar} title={item.title} type={item.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {item.title}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[var(--muted-foreground)]">
          {activityTypeLabel(item.type)}
          {item.subtitle ? (
            <>
              <span className="text-[var(--border)]"> · </span>
              {item.subtitle}
            </>
          ) : null}
        </p>
      </div>
      <time
        className="shrink-0 text-[11px] tabular-nums text-[var(--muted-foreground)]"
        dateTime={item.createdAt}
        dir="ltr"
      >
        {formatRelativeTime(item.createdAt)}
      </time>
    </>
  );

  const rowClass =
    'flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]';

  if (href) {
    return (
      <li>
        <Link href={href} className={rowClass}>
          {content}
        </Link>
      </li>
    );
  }

  return <li className={rowClass}>{content}</li>;
}

export function DashboardRecentActivity({
  items,
}: {
  items: ActivityItem[];
}) {
  const list = items.slice(0, HOME_ACTIVITY_LIMIT);

  return (
    <section className="dashboard-card flex h-full flex-col rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex min-w-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
            <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Recent activity
          </h2>
        </div>
        <Link
          href={`${APP_BASE}/users`}
          className="shrink-0 text-[12px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          Users
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="flex flex-1 items-center justify-center rounded-xl bg-[var(--surface-secondary)] px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
          No platform activity yet. New signups and resources will show up here.
        </p>
      ) : (
        <ul className="-mx-2 flex flex-1 flex-col">{list.map((item) => (
            <ActivityRow key={`${item.type}-${item.id}`} item={item} />
          ))}</ul>
      )}
    </section>
  );
}
