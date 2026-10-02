'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
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

function pickPreferredPhone(
  phones: WhatsappPhoneSummary[],
): WhatsappPhoneSummary | null {
  if (!phones.length) return null;
  return (
    phones.find((p) => p.status === 'ACTIVE' || p.status === 'CONNECTED') ??
    phones[0]
  );
}

function AccountStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const isActive = status === 'ACTIVE';
  const isPending = status === 'PENDING';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
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

function qualityTone(rating: string | null | undefined): string {
  const value = (rating || '').toUpperCase();
  if (value === 'GREEN') {
    return 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]';
  }
  if (value === 'YELLOW' || value === 'ORANGE') {
    return 'bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]';
  }
  if (value === 'RED') {
    return 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--background))] text-[var(--danger)]';
  }
  return 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]';
}

function PhoneListRow({ appId, phone }: { appId: string; phone: WhatsappPhoneSummary }) {
  const w = useTranslations().whatsapp;
  const display = phone.displayPhoneNumber || phone.phoneNumber;
  const name = phone.verifiedName || w.businessName;

  return (
    <li>
      <Link
        href={appWhatsappPhoneHref(appId, phone.phoneId)}
        className="group dashboard-panel flex items-center gap-3.5 p-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))] sm:gap-4 sm:p-4"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
          <Phone className="size-4" strokeWidth={1.75} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="truncate font-mono text-[14px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[15px]"
            dir="ltr"
          >
            {display}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--muted-foreground)]">
            {name}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          {phone.qualityRating ? (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                qualityTone(phone.qualityRating),
              )}
            >
              {phone.qualityRating}
            </span>
          ) : null}
          <PhoneStatusBadge status={phone.status} />
        </div>

        <ArrowUpRight
          className="size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--foreground)]"
          aria-hidden
        />
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
        description={w.notConnectedDesc}
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
  const preferredPhone = pickPreferredPhone(phones);
  const templatesHref = preferredPhone
    ? appWhatsappPhoneHref(appId, preferredPhone.phoneId, 'templates')
    : appWhatsappHref(appId, 'phones');

  return (
    <div className="dashboard-section-stack">
      <section className="dashboard-panel p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)]">
              <MessageSquare className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
                  {activeAccount.businessName || activeAccount.verifiedName || 'WABA'}
                </h2>
                <AccountStatusBadge status={activeAccount.status} />
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-[var(--muted-foreground)] sm:text-xs" dir="ltr">
                {w.wabaId}: {activeAccount.wabaId}
              </p>
            </div>
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

      {activeAccount.onboarding?.paymentMethodRequired !== false ? (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] px-4 py-4 sm:px-5">
          <p className="text-[13px] leading-relaxed text-[var(--foreground)]">
            {w.paymentRequiredBanner}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={
                activeAccount.onboarding?.paymentHelpUrl ||
                'https://www.facebook.com/business/help/488291839463771'
              }
              target="_blank"
              rel="noopener noreferrer"
              className={whatsappBtnSecondary}
            >
              {w.paymentHelpCta}
            </a>
            <a
              href={
                activeAccount.onboarding?.whatsappManagerUrl ||
                'https://business.facebook.com/wa/manage/home/'
              }
              target="_blank"
              rel="noopener noreferrer"
              className={whatsappBtnSecondary}
            >
              {w.paymentManagerCta}
            </a>
          </div>
        </div>
      ) : null}

      {phoneCount === 0 ? (
        <section className="dashboard-panel space-y-3 p-4 sm:p-5">
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {w.phonesPendingMeta}
          </p>
          {activeAccount.wabaId ? (
            <EmbeddedSignupButton
              appId={appId}
              mode="add-phone"
              wabaId={activeAccount.wabaId}
            />
          ) : null}
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                {w.linkedPhones}
              </h3>
              <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                {formatCount(phoneCount)} · {w.metricPhonesHint}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeAccount.wabaId ? (
                <EmbeddedSignupButton
                  appId={appId}
                  mode="add-phone"
                  wabaId={activeAccount.wabaId}
                  compact
                  variant="secondary"
                />
              ) : null}
              <Link href={appWhatsappHref(appId, 'phones')} className={whatsappBtnSecondary}>
                {w.managePhones}
              </Link>
            </div>
          </div>

          <ul className="space-y-2.5">
            {previewPhones.map((phone) => (
              <PhoneListRow key={phone.id} appId={appId} phone={phone} />
            ))}
          </ul>

          {phoneCount > previewPhones.length ? (
            <Link
              href={appWhatsappHref(appId, 'phones')}
              className="inline-flex text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {w.phonesMore.replace('{count}', String(phoneCount - previewPhones.length))}
            </Link>
          ) : null}
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{d.quickActions}</h3>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardQuickAction
            href={appWhatsappHref(appId, 'phones')}
            title={w.navPhones}
            description={w.actionPhonesDesc}
            icon={Phone}
            isRtl={isRtl}
            className="rounded-[1.25rem] sm:rounded-[1.25rem]"
          />
          <DashboardQuickAction
            href={templatesHref}
            title={w.navTemplates}
            description={w.actionTemplatesDesc}
            icon={ScrollText}
            isRtl={isRtl}
            className="rounded-[1.25rem] sm:rounded-[1.25rem]"
          />
          <DashboardQuickAction
            href={appWhatsappApi(appId)}
            title={w.viewApiDocs}
            description={w.actionApiDocsDesc}
            icon={MessageSquare}
            isRtl={isRtl}
            className="rounded-[1.25rem] sm:rounded-[1.25rem]"
          />
          <DashboardQuickAction
            href={appApiKeysNew(appId)}
            title={w.createApiKey}
            description={w.actionApiKeyDesc}
            icon={Key}
            isRtl={isRtl}
            className="rounded-[1.25rem] sm:rounded-[1.25rem]"
          />
          <DashboardQuickAction
            href={appWhatsappHref(appId, 'webhooks')}
            title={w.navWebhooks}
            description={w.actionWebhooksDesc}
            icon={Webhook}
            isRtl={isRtl}
            className="rounded-[1.25rem] sm:rounded-[1.25rem]"
          />
        </div>
      </section>
    </div>
  );
}
