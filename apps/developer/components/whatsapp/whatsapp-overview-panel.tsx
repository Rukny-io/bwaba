'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleCheck,
  Key,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  ScrollText,
  Unplug,
  Webhook,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { EmbeddedSignupButton } from '@/components/whatsapp/embedded-signup-button';
import { PhoneStatusBadge } from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappAccounts, useWhatsappMutations } from '@/hooks/use-whatsapp';
import type { WhatsappPhoneSummary } from '@/lib/api/types';
import { appApiKeysNew, appWhatsappApi } from '@/lib/app-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatConnectedDate(iso: string | null | undefined, isRtl: boolean): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(isRtl ? 'ar-IQ' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(iso));
}

function AccountStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const isActive = status === 'ACTIVE';
  const isPending = status === 'PENDING';

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        isActive &&
          'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]',
        isPending &&
          'bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]',
        !isActive &&
          !isPending &&
          'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {isActive ? w.connected : isPending ? w.pending : w.disconnected}
    </span>
  );
}

function PhoneListRow({ phone }: { phone: WhatsappPhoneSummary }) {
  const w = useTranslations().whatsapp;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-[var(--foreground)]" dir="ltr">
          {phone.displayPhoneNumber || phone.phoneNumber}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
          {phone.verifiedName || w.businessName}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {phone.qualityRating ? (
          <span className="text-[11px] text-[var(--muted-foreground)]">
            {w.quality}:{' '}
            <span className="font-medium text-[var(--foreground)]">{phone.qualityRating}</span>
          </span>
        ) : null}
        <PhoneStatusBadge status={phone.status} />
      </div>
    </li>
  );
}

function WhatsappQuickAction({
  href,
  label,
  desc,
  icon: Icon,
  variant,
  isRtl,
}: {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  variant: 'primary' | 'accent' | 'soft';
  isRtl: boolean;
}) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const iconVariantClass = {
    primary: 'bg-[var(--foreground)] text-[var(--background)]',
    accent:
      'bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]',
    soft: 'bg-[var(--surface-secondary)] text-[var(--primary)]',
  } as const;

  return (
    <Link
      href={href}
      className="dashboard-card dashboard-card-interactive group flex h-full flex-col rounded-2xl p-3.5 sm:rounded-3xl sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.03]',
            iconVariantClass[variant],
          )}
        >
          <Icon size={18} strokeWidth={1.8} />
        </div>
        <Arrow
          size={15}
          className={cn(
            'mt-0.5 shrink-0 text-[var(--muted-foreground)] transition-all duration-200',
            isRtl
              ? 'opacity-60 group-hover:-translate-x-0.5 group-hover:opacity-100'
              : 'opacity-60 group-hover:translate-x-0.5 group-hover:opacity-100',
          )}
        />
      </div>
      <div className="mt-3 min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
          {label}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted-foreground)] sm:text-xs">
          {desc}
        </p>
      </div>
    </Link>
  );
}

export function WhatsappOverviewPanel({ appId }: { appId: string }) {
  const t = useTranslations();
  const w = t.whatsapp;
  const d = t.dashboard;
  const isRtl = t.common.switchLang === 'English';
  const { data: accounts, isLoading } = useWhatsappAccounts(appId);
  const { disconnectMutation, refreshMutation } = useWhatsappMutations(appId);

  const activeAccount = accounts?.find((a) => a.status === 'ACTIVE') ?? accounts?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!activeAccount || activeAccount.status === 'DISCONNECTED') {
    return (
      <section className="dashboard-card rounded-2xl p-6 text-center sm:rounded-3xl sm:p-8 sm:text-start">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)] sm:mx-0">
          <MessageSquare className="size-6" strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">{w.notConnected}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)] sm:mx-0">
          {w.notConnectedDesc}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--muted-foreground)] sm:mx-0">
          {w.connectHint}
        </p>
        <div className="mt-5 flex justify-center sm:justify-start">
          <EmbeddedSignupButton appId={appId} />
        </div>
      </section>
    );
  }

  const phones = activeAccount.phoneNumbers ?? [];
  const phoneCount = phones.length;
  const activePhoneCount = phones.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'CONNECTED',
  ).length;
  const previewPhones = phones.slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="dashboard-card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
                {activeAccount.businessName || activeAccount.verifiedName || 'WABA'}
              </h2>
              <AccountStatusBadge status={activeAccount.status} />
            </div>
            <p className="mt-1.5 font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
              {w.wabaId}: {activeAccount.wabaId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <button
              type="button"
              disabled={refreshMutation.isPending}
              onClick={() =>
                refreshMutation.mutate(activeAccount.id, {
                  onSuccess: () => appToast.success(w.refresh),
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <RefreshCw
                className={cn('size-3.5', refreshMutation.isPending && 'animate-spin')}
              />
              {w.refresh}
            </button>
            <button
              type="button"
              disabled={disconnectMutation.isPending}
              onClick={() => {
                if (!window.confirm(w.disconnectConfirm)) return;
                disconnectMutation.mutate(activeAccount.id, {
                  onSuccess: () => appToast.success(w.disconnected),
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] px-4 text-xs font-medium text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--background))]"
            >
              <Unplug className="size-3.5" />
              {w.disconnect}
            </button>
          </div>
        </div>
      </section>

      <DashboardGrid>
        <DashboardMetricCard
          icon={Phone}
          label={w.phonesCount}
          value={formatCount(phoneCount)}
          comparisonPrimary={w.metricPhonesHint}
        />
        <DashboardMetricCard
          icon={CircleCheck}
          label={w.metricActivePhones}
          value={formatCount(activePhoneCount)}
          comparisonPrimary={w.metricActivePhonesHint}
        />
        <DashboardMetricCard
          icon={MessageSquare}
          label={w.metricConnectedAt}
          value={formatConnectedDate(activeAccount.connectedAt, isRtl)}
          comparisonPrimary={w.metricConnectedAtHint}
        />
        <DashboardMetricCard
          icon={CircleCheck}
          label={w.status}
          value={activeAccount.status === 'ACTIVE' ? w.connected : w.pending}
          comparisonPrimary={w.metricAccountHint}
        />
      </DashboardGrid>

      {phoneCount === 0 ? (
        <p className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_25%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_6%,var(--background))] px-4 py-3 text-xs leading-relaxed text-[var(--warning)] sm:rounded-3xl sm:px-5 sm:text-sm">
          {w.phonesPendingMeta}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {w.linkedPhones}
          </h3>
          <Link
            href={appWhatsappHref(appId, 'phones')}
            className="text-xs font-medium text-[var(--primary)] transition-opacity hover:opacity-80"
          >
            {w.managePhones}
          </Link>
        </div>

        {previewPhones.length > 0 ? (
          <ul className="dashboard-card divide-y divide-[var(--border)] overflow-hidden rounded-2xl sm:rounded-3xl">
            {previewPhones.map((phone) => (
              <PhoneListRow key={phone.id} phone={phone} />
            ))}
          </ul>
        ) : (
          <div className="dashboard-card rounded-2xl px-4 py-8 text-center text-sm text-[var(--muted-foreground)] sm:rounded-3xl">
            {w.noPhones}
          </div>
        )}

        {phoneCount > previewPhones.length ? (
          <p className="px-0.5 text-xs text-[var(--muted-foreground)]">
            {w.phonesMore.replace('{count}', String(phoneCount - previewPhones.length))}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div className="px-0.5">
          <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {d.quickActions}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <WhatsappQuickAction
            href={appWhatsappHref(appId, 'phones')}
            label={w.navPhones}
            desc={w.actionPhonesDesc}
            icon={Phone}
            variant="accent"
            isRtl={isRtl}
          />
          <WhatsappQuickAction
            href={appWhatsappHref(appId, 'templates')}
            label={w.navTemplates}
            desc={w.actionTemplatesDesc}
            icon={ScrollText}
            variant="soft"
            isRtl={isRtl}
          />
          <WhatsappQuickAction
            href={appWhatsappApi(appId)}
            label={w.viewApiDocs}
            desc={w.actionApiDocsDesc}
            icon={BookOpen}
            variant="soft"
            isRtl={isRtl}
          />
          <WhatsappQuickAction
            href={appApiKeysNew(appId)}
            label={w.createApiKey}
            desc={w.actionApiKeyDesc}
            icon={Key}
            variant="primary"
            isRtl={isRtl}
          />
          <WhatsappQuickAction
            href={appWhatsappHref(appId, 'webhooks')}
            label={w.navWebhooks}
            desc={w.actionWebhooksDesc}
            icon={Webhook}
            variant="soft"
            isRtl={isRtl}
          />
        </div>
      </section>
    </div>
  );
}
