import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Instagram,
  Link2,
  MessageCircle,
  MessagesSquare,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import type { InstagramAccountSummary } from '@/lib/business-dashboard-data';
import { APP_BASE } from '@/lib/business-routes';
import type { InboxConversation } from '@/lib/inbox';
import { instagramAccountPath } from '@/lib/instagram';
import { cn } from '@/lib/utils';

const HOME_PANEL_LIMIT = 3;

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
        'flex h-full flex-col rounded-[1.75rem] bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-5',
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
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-[var(--border)]/40">
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

function ListRow({
  href,
  icon: Icon,
  title,
  meta,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  meta: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-2xl px-2.5 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]"
    >
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/50 transition-transform group-hover:scale-[1.03]">
        <Icon size={15} strokeWidth={1.85} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
          {title}
        </p>
        <div className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
          {meta}
        </div>
      </div>
    </Link>
  );
}

export function DashboardHomeConnectedAccounts({
  accounts,
}: {
  accounts: InstagramAccountSummary[];
}) {
  const items = accounts.slice(0, HOME_PANEL_LIMIT);

  return (
    <PanelShell>
      <PanelHeader
        title="حسابات Instagram"
        icon={Instagram}
        href="/app/instagram"
        linkLabel="إدارة الحسابات"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="لا توجد حسابات مربوطة"
          description="اربط حساب Instagram Professional لاستقبال المحادثات."
          actionHref="/app/instagram"
          actionLabel="ربط Instagram"
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {items.map((account) => (
            <li key={account.id}>
              <ListRow
                href={instagramAccountPath(account.id)}
                icon={Instagram}
                title={account.name || account.username}
                meta={
                  <>
                    <span dir="ltr">@{account.username}</span>
                    {account.followersCount != null ? (
                      <>
                        <span aria-hidden> · </span>
                        <span dir="ltr">
                          {account.followersCount.toLocaleString('en-US')} متابع
                        </span>
                      </>
                    ) : null}
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

function formatConversationTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ar', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function inboxConversationPath(conversationId: string): string {
  return `${APP_BASE}/inbox?conversation=${encodeURIComponent(conversationId)}`;
}

export function DashboardHomeRecentConversations({
  conversations,
  hasInstagramAccounts,
}: {
  conversations: InboxConversation[];
  hasInstagramAccounts: boolean;
}) {
  const items = conversations.slice(0, HOME_PANEL_LIMIT);

  return (
    <PanelShell>
      <PanelHeader
        title="محادثات حديثة"
        icon={MessagesSquare}
        href={`${APP_BASE}/inbox`}
        linkLabel="صندوق الوارد"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="لا توجد محادثات بعد"
          description={
            hasInstagramAccounts
              ? 'أرسل DM لحسابك على Instagram لتظهر هنا.'
              : 'اربط Instagram لاستقبال رسائل Direct.'
          }
          actionHref={hasInstagramAccounts ? `${APP_BASE}/inbox` : `${APP_BASE}/instagram`}
          actionLabel={hasInstagramAccounts ? 'فتح صندوق الوارد' : 'ربط Instagram'}
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {items.map((conversation) => (
            <li key={conversation.id}>
              <ListRow
                href={inboxConversationPath(conversation.id)}
                icon={Instagram}
                title={conversation.participantName}
                meta={
                  <>
                    <span className="line-clamp-1">{conversation.preview || '—'}</span>
                    {conversation.unreadCount > 0 ? (
                      <>
                        <span aria-hidden> · </span>
                        <span>{conversation.unreadCount} غير مقروء</span>
                      </>
                    ) : null}
                    {conversation.updatedAt ? (
                      <>
                        <span aria-hidden> · </span>
                        <span>{formatConversationTime(conversation.updatedAt)}</span>
                      </>
                    ) : null}
                  </>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function DashboardHomeChannelStatus({
  hasInstagram,
}: {
  hasInstagram: boolean;
}) {
  return (
    <PanelShell>
      <PanelHeader
        title="حالة القنوات"
        icon={MessageCircle}
        href="/app/messenger"
        linkLabel="Messenger"
      />

      <ul className="flex flex-1 flex-col gap-2">
        <li className="flex items-center justify-between rounded-2xl bg-[var(--surface-secondary)]/60 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <Instagram size={16} className="text-[#bc1888]" aria-hidden />
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              Instagram
            </span>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              hasInstagram
                ? 'bg-[var(--brand-soft-lime)] text-[var(--success)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
            )}
          >
            {hasInstagram ? 'متصل' : 'غير مربوط'}
          </span>
        </li>
        <li className="flex items-center justify-between rounded-2xl bg-[var(--surface-secondary)]/60 px-3 py-3">
          <div className="flex items-center gap-2.5">
            <MessageCircle size={16} className="text-[#0084ff]" aria-hidden />
            <span className="text-[13px] font-semibold text-[var(--foreground)]">
              Messenger
            </span>
          </div>
          <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,var(--surface))] px-2 py-0.5 text-[10px] font-semibold text-[var(--warning)]">
            قريباً
          </span>
        </li>
      </ul>
    </PanelShell>
  );
}
