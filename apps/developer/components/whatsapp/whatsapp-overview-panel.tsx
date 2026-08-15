'use client';

import Link from 'next/link';
import {
  CircleCheck,
  Key,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Unplug,
  Webhook,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { DashboardQuickAction } from '@/components/dashboard/dashboard-quick-action';
import { EmbeddedSignupButton } from '@/components/whatsapp/embedded-signup-button';
import {
  PhoneStatusBadge,
  WhatsappEmptyState,
  whatsappBtnDanger,
  whatsappBtnSecondary,
} from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappAccounts, useWhatsappMutations } from '@/hooks/use-whatsapp';
import type { WhatsappPhoneSummary } from '@/lib/api/types';
import { appApiKeysNew, appWhatsappApi } from '@/lib/app-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { appWhatsappPhoneHref } from '@/lib/whatsapp-phone-routes';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatConnectedDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', {
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
        'rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
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

function PhoneListRow({ appId, phone }: { appId: string; phone: WhatsappPhoneSummary }) {
  const w = useTranslations().whatsapp;

  return (
    <li>
      <Link
        href={appWhatsappPhoneHref(appId, phone.phoneId)}
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_50%,transparent)] sm:px-5"
      >
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-[var(--foreground)]" dir="ltr">
            {phone.displayPhoneNumber || phone.phoneNumber}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {phone.verifiedName || w.businessName}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]" dir="ltr">
            {phone.phoneId}
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
      </Link>
    </li>
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
      <WhatsappEmptyState
        icon={MessageSquare}
        title={w.notConnected}
        description={`${w.notConnectedDesc} ${w.connectHint}`}
        action={<EmbeddedSignupButton appId={appId} />}
      />
    );
  }

  const phones = activeAccount.phoneNumbers ?? [];
  const phoneCount = phones.length;
  const activePhoneCount = phones.filter(
    (p) => p.status === 'ACTIVE' || p.status === 'CONNECTED',
  ).length;
  const previewPhones = phones.slice(0, 4);

  return (
    <div className="dashboard-section-stack">
      <section className="dashboard-panel rounded-2xl p-5 sm:rounded-3xl sm:p-6">
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
              className={whatsappBtnSecondary}
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
              className={whatsappBtnDanger}
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
          value={formatConnectedDate(activeAccount.connectedAt)}
          comparisonPrimary={w.metricConnectedAtHint}
          tabular
        />
        <DashboardMetricCard
          icon={CircleCheck}
          label={w.status}
          value={activeAccount.status === 'ACTIVE' ? w.connected : w.pending}
          comparisonPrimary={w.metricAccountHint}
          tabular={false}
        />
      </DashboardGrid>

      {phoneCount === 0 ? (
        <div className="space-y-3">
          <p className="rounded-2xl bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] px-4 py-3 text-[13px] leading-relaxed text-[var(--warning)] sm:px-5">
            {w.phonesPendingMeta}
          </p>
          {activeAccount.wabaId ? (
            <EmbeddedSignupButton
              appId={appId}
              mode="add-phone"
              wabaId={activeAccount.wabaId}
            />
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            {w.linkedPhones}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {activeAccount?.wabaId ? (
              <EmbeddedSignupButton
                appId={appId}
                mode="add-phone"
                wabaId={activeAccount.wabaId}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 text-[12.5px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)] disabled:opacity-40"
              />
            ) : null}
            <Link
              href={appWhatsappHref(appId, 'phones')}
              className="text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {w.managePhones}
            </Link>
          </div>
        </div>

        {previewPhones.length > 0 ? (
          <ul className="dashboard-panel divide-y divide-[var(--border)]/30 overflow-hidden rounded-2xl sm:rounded-3xl">
            {previewPhones.map((phone) => (
              <PhoneListRow key={phone.id} appId={appId} phone={phone} />
            ))}
          </ul>
        ) : (
          <WhatsappEmptyState icon={Phone} title={w.noPhones} />
        )}

        {phoneCount > previewPhones.length ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            {w.phonesMore.replace('{count}', String(phoneCount - previewPhones.length))}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
          {d.quickActions}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardQuickAction
            href={appWhatsappHref(appId, 'phones')}
            title={w.navPhones}
            description={w.actionPhonesDesc}
            icon={Phone}
            isRtl={isRtl}
          />
          <DashboardQuickAction
            href={appWhatsappApi(appId)}
            title={w.viewApiDocs}
            description={w.actionApiDocsDesc}
            icon={MessageSquare}
            isRtl={isRtl}
          />
          <DashboardQuickAction
            href={appApiKeysNew(appId)}
            title={w.createApiKey}
            description={w.actionApiKeyDesc}
            icon={Key}
            isRtl={isRtl}
          />
          <DashboardQuickAction
            href={appWhatsappHref(appId, 'webhooks')}
            title={w.navWebhooks}
            description={w.actionWebhooksDesc}
            icon={Webhook}
            isRtl={isRtl}
          />
        </div>
      </section>
    </div>
  );
}
