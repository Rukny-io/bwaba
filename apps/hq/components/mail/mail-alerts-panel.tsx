'use client';

import Link from 'next/link';
import type { MailAlertApp, MailAlertsResponse } from '@/lib/types/mail';
import { formatNumber } from '@/lib/dashboard-format';
import { formatMailDomainStatus, formatMailStorageRatio } from '@/lib/mail-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function AlertSection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={detailPanelClassName}>
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      {empty ? (
        <p className="text-xs text-[var(--muted-foreground)]">No items</p>
      ) : (
        children
      )}
    </section>
  );
}

function AppAlertRow({
  app,
  href,
  extra,
}: {
  app: Pick<MailAlertApp, 'appId' | 'name' | 'primaryDomain' | 'owner' | 'contactEmail'>;
  href?: string;
  extra?: React.ReactNode;
}) {
  return (
    <li className="border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={href ?? `/app/mail/${app.appId}`}
            className="block truncate text-sm font-medium hover:text-[var(--primary)]"
          >
            {app.name}
          </Link>
          <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
            {app.appId}
          </p>
          {app.primaryDomain ? (
            <p className="truncate text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {app.primaryDomain}
            </p>
          ) : null}
          {app.owner?.email || app.contactEmail ? (
            <p className="truncate text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {app.owner?.email ?? app.contactEmail}
            </p>
          ) : null}
        </div>
        {extra}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-medium">
        <Link href={`/app/mail/${app.appId}`} className="text-[var(--primary)] hover:underline">
          Details
        </Link>
        <Link
          href={`/app/mail/${app.appId}?tab=analytics`}
          className="text-[var(--primary)] hover:underline"
        >
          Analytics
        </Link>
      </div>
    </li>
  );
}

export function MailAlertsPanel({
  data,
  loading,
}: {
  data: MailAlertsResponse | null;
  loading?: boolean;
}) {
  if (loading || !data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AlertSection title="No subscription" empty={data.noSubscription.length === 0}>
        <ul>
          {data.noSubscription.map((item) => (
            <AppAlertRow key={item.appId} app={item} href={`/app/mail/${item.appId}?tab=subscription`} />
          ))}
        </ul>
      </AlertSection>

      <AlertSection title="Storage ≥ 90%" empty={data.storageHigh.length === 0}>
        <ul>
          {data.storageHigh.map((item) => (
            <AppAlertRow
              key={item.appId}
              app={item}
              extra={
                <span className="shrink-0 text-xs tabular-nums text-[var(--muted-foreground)]" dir="ltr">
                  {formatMailStorageRatio(item.usedBytes, item.quotaBytes)}
                </span>
              }
            />
          ))}
        </ul>
      </AlertSection>

      <AlertSection title="Failed delivery (24h)" empty={data.deliveryFailed24h.length === 0}>
        <ul>
          {data.deliveryFailed24h.map((item) => (
            <AppAlertRow
              key={item.appId}
              app={item}
              href={`/app/mail/${item.appId}?tab=delivery`}
              extra={
                <span className="shrink-0 tabular-nums text-xs text-[var(--danger)]">
                  {formatNumber(item.count)}
                </span>
              }
            />
          ))}
        </ul>
      </AlertSection>

      <AlertSection title="Unverified domain" empty={data.domainUnverified.length === 0}>
        <ul>
          {data.domainUnverified.map((item) => (
            <AppAlertRow
              key={item.appId}
              app={item}
              href={`/app/mail/${item.appId}?tab=domain`}
              extra={
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {formatMailDomainStatus(item.domainStatus ?? 'NONE')}
                </span>
              }
            />
          ))}
        </ul>
      </AlertSection>

      <AlertSection title="Open plan tickets" empty={data.planTickets.length === 0}>
        <ul className="space-y-2 text-sm">
          {data.planTickets.map((item) => (
            <li
              key={item.ticketId}
              className="border-b border-[var(--border)]/60 py-2.5 last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/app/support-tickets/${item.ticketId}`}
                  className="hover:text-[var(--primary)]"
                >
                  {item.number} · {item.mailAppName || item.subject}
                </Link>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">{item.status}</span>
              </div>
              {item.mailAppId ? (
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] font-medium">
                  <Link
                    href={`/app/mail/${item.mailAppId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/app/mail/${item.mailAppId}?tab=analytics`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    Analytics
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </AlertSection>
    </div>
  );
}
