'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  KeyRound,
  Link2,
  Plus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { DeveloperApiKey, WhatsappAccountSummary } from '@/lib/api/types';
import type { LinkedFormSummary } from '@/lib/api/forms';
import {
  appApiKeys,
  appApiKeysNew,
  appForms,
  appWhatsapp,
} from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const HOME_PANEL_LIMIT = 3;

export type DashboardActivityItem = {
  id: string;
  type: 'api_key' | 'whatsapp' | 'form' | 'generic';
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

type PanelLabels = {
  viewAll: string;
  recentKeys: string;
  recentKeysEmptyTitle: string;
  recentKeysEmptyDesc: string;
  createKey: string;
  integrations: string;
  integrationsEmptyTitle: string;
  integrationsEmptyDesc: string;
  connectWhatsapp: string;
  activity: string;
  activityEmptyTitle: string;
  activityEmptyDesc: string;
  keyActive: string;
  keyInactive: string;
  requests: string;
  linkedForm: string;
  submissions: string;
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
        'dashboard-card flex h-full flex-col rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5',
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
  isRtl,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  linkLabel: string;
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3 sm:mb-4">
      <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--surface-secondary)] py-1 pe-3 ps-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)]">
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
        <Arrow size={12} strokeWidth={2.2} aria-hidden />
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
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)]">
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
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--primary)] transition-transform group-hover:scale-[1.03]">
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

function formatRelativeTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
  return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
}

function activityIcon(type: DashboardActivityItem['type']): LucideIcon {
  if (type === 'api_key') return KeyRound;
  if (type === 'whatsapp') return Link2;
  if (type === 'form') return FileText;
  return Sparkles;
}

export function buildDashboardActivity(input: {
  publicAppId: string;
  keys: DeveloperApiKey[];
  accounts: WhatsappAccountSummary[];
  linkedForms: LinkedFormSummary[];
  labels: {
    keyCreated: string;
    keyUsed: string;
    whatsappConnected: string;
    formLinked: string;
  };
}): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  for (const key of input.keys) {
    if (key.lastUsedAt) {
      items.push({
        id: `key-used-${key.id}`,
        type: 'api_key',
        title: input.labels.keyUsed,
        description: key.name,
        href: appApiKeys(input.publicAppId),
        createdAt: key.lastUsedAt,
      });
    }
    items.push({
      id: `key-created-${key.id}`,
      type: 'api_key',
      title: input.labels.keyCreated,
      description: key.name,
      href: appApiKeys(input.publicAppId),
      createdAt: key.createdAt,
    });
  }

  for (const account of input.accounts) {
    const at = account.connectedAt;
    if (!at) continue;
    items.push({
      id: `wa-${account.id}`,
      type: 'whatsapp',
      title: input.labels.whatsappConnected,
      description:
        account.verifiedName || account.businessName || account.wabaId || 'WhatsApp',
      href: appWhatsapp(input.publicAppId),
      createdAt: at,
    });
  }

  for (const form of input.linkedForms) {
    items.push({
      id: `form-${form.id}`,
      type: 'form',
      title: input.labels.formLinked,
      description: form.title,
      href: appForms(input.publicAppId),
      createdAt: form.updatedAt || form.createdAt,
    });
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 12);
}

export function DashboardHomeRecentKeys({
  publicAppId,
  keys,
  labels,
  isRtl,
  locale,
}: {
  publicAppId: string;
  keys: DeveloperApiKey[];
  labels: PanelLabels;
  isRtl: boolean;
  locale: string;
}) {
  const items = [...keys]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, HOME_PANEL_LIMIT);

  return (
    <PanelShell>
      <PanelHeader
        title={labels.recentKeys}
        icon={KeyRound}
        href={appApiKeys(publicAppId)}
        linkLabel={labels.viewAll}
        isRtl={isRtl}
      />
      {items.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={labels.recentKeysEmptyTitle}
          description={labels.recentKeysEmptyDesc}
          actionHref={appApiKeysNew(publicAppId)}
          actionLabel={labels.createKey}
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {items.map((key) => (
            <li key={key.id}>
              <ListRow
                href={appApiKeys(publicAppId)}
                icon={KeyRound}
                title={key.name}
                trailing={
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      key.status === 'ACTIVE'
                        ? 'bg-[var(--brand-soft-lime)] text-[var(--success)] ring-1 ring-[color-mix(in_srgb,var(--success)_30%,transparent)]'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/70',
                    )}
                  >
                    {key.status === 'ACTIVE'
                      ? labels.keyActive
                      : labels.keyInactive}
                  </span>
                }
                meta={
                  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span dir="ltr" className="font-mono">
                      {key.keyPrefix}…{key.keySuffix}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span dir="ltr" lang="en">
                      {Number(key.requestCount ?? 0)} {labels.requests}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span dir="ltr" lang="en">
                      {formatRelativeTime(key.createdAt, locale)}
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

export function DashboardHomeIntegrations({
  publicAppId,
  accounts,
  linkedForms,
  labels,
  isRtl,
  locale,
}: {
  publicAppId: string;
  accounts: WhatsappAccountSummary[];
  linkedForms: LinkedFormSummary[];
  labels: PanelLabels;
  isRtl: boolean;
  locale: string;
}) {
  type Row = {
    id: string;
    href: string;
    icon: LucideIcon;
    title: string;
    meta: ReactNode;
  };

  const rows: Row[] = [
    ...accounts.map((account) => ({
      id: `wa-${account.id}`,
      href: appWhatsapp(publicAppId),
      icon: Link2,
      title:
        account.verifiedName ||
        account.businessName ||
        account.wabaId ||
        'WhatsApp',
      meta: (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span>{account.status}</span>
          {account.connectedAt ? (
            <>
              <span className="text-[var(--border)]">·</span>
              <span dir="ltr" lang="en">
                {formatRelativeTime(account.connectedAt, locale)}
              </span>
            </>
          ) : null}
        </span>
      ),
    })),
    ...linkedForms.map((form) => ({
      id: `form-${form.id}`,
      href: appForms(publicAppId),
      icon: FileText,
      title: form.title,
      meta: (
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span>{labels.linkedForm}</span>
          <span className="text-[var(--border)]">·</span>
          <span dir="ltr" lang="en">
            {form.submissionCount} {labels.submissions}
          </span>
        </span>
      ),
    })),
  ].slice(0, HOME_PANEL_LIMIT);

  return (
    <PanelShell>
      <PanelHeader
        title={labels.integrations}
        icon={Link2}
        href={appWhatsapp(publicAppId)}
        linkLabel={labels.viewAll}
        isRtl={isRtl}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={Link2}
          title={labels.integrationsEmptyTitle}
          description={labels.integrationsEmptyDesc}
          actionHref={appWhatsapp(publicAppId)}
          actionLabel={labels.connectWhatsapp}
        />
      ) : (
        <ul className="flex flex-1 flex-col gap-0.5">
          {rows.map((row) => (
            <li key={row.id}>
              <ListRow
                href={row.href}
                icon={row.icon}
                title={row.title}
                meta={row.meta}
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
  labels,
  isRtl,
  locale,
  publicAppId,
}: {
  items: DashboardActivityItem[];
  labels: PanelLabels;
  isRtl: boolean;
  locale: string;
  publicAppId: string;
}) {
  const list = items.slice(0, HOME_PANEL_LIMIT);
  return (
    <PanelShell>
      <PanelHeader
        title={labels.activity}
        icon={Sparkles}
        href={appApiKeys(publicAppId)}
        linkLabel={labels.viewAll}
        isRtl={isRtl}
      />
      {list.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={labels.activityEmptyTitle}
          description={labels.activityEmptyDesc}
          actionHref={appApiKeysNew(publicAppId)}
          actionLabel={labels.createKey}
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
                        {formatRelativeTime(item.createdAt, locale)}
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
