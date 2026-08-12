'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  FileText,
  KeyRound,
  MessageSquare,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { AnalyticsPeriodPicker } from '@/components/analytics/analytics-period-picker';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { AnalyticsBreakdownList } from '@/components/analytics/analytics-breakdown-list';
import { useAppAnalytics } from '@/hooks/use-app-analytics';
import type { AnalyticsPeriodDays } from '@/lib/api/analytics';
import { appApiKeys, appForms, appWallet, appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatTrend(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

function formatDateTime(value: string | null, neverLabel: string): string {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

interface AppAnalyticsViewProps {
  publicAppId: string;
  appName: string;
}

export function AppAnalyticsView({
  publicAppId,
  appName,
}: AppAnalyticsViewProps) {
  const t = useTranslations();
  const a = t.analytics;
  const isRtl = t.common.switchLang === 'English';
  const [days, setDays] = useState<AnalyticsPeriodDays>(30);
  const { data, isLoading, isError, refetch, isFetching } = useAppAnalytics(
    publicAppId,
    days,
  );

  const periodLabels = {
    period7: a.period7,
    period30: a.period30,
    period90: a.period90,
  };

  if (isLoading && !data) {
    return (
      <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
        <DashboardPageHeader
          title={a.title}
          description={a.subtitle.replace('{app}', appName)}
          actions={<AnalyticsPeriodPicker value={days} onChange={setDays} labels={periodLabels} />}
        />
        <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="dashboard-metric-tile h-[7.25rem] animate-pulse rounded-2xl"
            />
          ))}
        </div>
        <div className="dashboard-panel h-72 animate-pulse rounded-2xl" />
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
        <DashboardPageHeader
          title={a.title}
          description={a.subtitle.replace('{app}', appName)}
        />
        <div className="dashboard-panel flex flex-col items-start gap-3 rounded-2xl p-5">
          <p className="text-sm text-[var(--muted-foreground)]">{a.loadError}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-[13px] font-medium text-[var(--foreground)]"
          >
            <RefreshCw className="size-3.5" />
            {a.retry}
          </button>
        </div>
      </section>
    );
  }

  const { summary } = data;
  const hasMessageBreakdown =
    Object.keys(data.messagesByStatus).length +
      Object.keys(data.messagesByType).length +
      Object.keys(data.messagesByDirection).length >
    0;

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0"
        title={a.title}
        description={a.subtitle.replace('{app}', appName)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AnalyticsPeriodPicker
              value={days}
              onChange={setDays}
              labels={periodLabels}
            />
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex size-9 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] disabled:opacity-50"
              aria-label={a.retry}
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
            </button>
          </div>
        }
      >
        <p className="text-[12px] text-[var(--muted-foreground)]">
          {a.periodLabel}:{' '}
          <span dir="ltr" lang="en" className="tabular-nums">
            {data.period.startDate} — {data.period.endDate}
          </span>
        </p>
      </DashboardPageHeader>

      <div className="grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <DashboardMetricCard
          icon={Activity}
          label={a.metricApiRequests}
          value={formatCount(summary.apiRequests)}
          comparisonPrimary={a.metricApiRequestsHint}
          trend={formatTrend(summary.apiRequestsTrend)}
          trendPositive={summary.apiRequestsTrend >= 0}
          comparisonSecondary={a.vsPrevious}
        />
        <DashboardMetricCard
          icon={MessageSquare}
          label={a.metricMessages}
          value={formatCount(summary.messages)}
          comparisonPrimary={`${a.metricDelivered} ${formatCount(summary.messagesDelivered)}`}
          trend={formatTrend(summary.messagesTrend)}
          trendPositive={summary.messagesTrend >= 0}
          comparisonSecondary={a.vsPrevious}
        />
        <DashboardMetricCard
          icon={FileText}
          label={a.metricFormViews}
          value={formatCount(summary.formViews)}
          comparisonPrimary={a.metricFormViewsHint}
          trend={formatTrend(summary.formViewsTrend)}
          trendPositive={summary.formViewsTrend >= 0}
          comparisonSecondary={a.vsPrevious}
        />
        <DashboardMetricCard
          icon={FileText}
          label={a.metricFormSubmissions}
          value={formatCount(summary.formSubmissions)}
          comparisonPrimary={a.metricFormSubmissionsHint}
          trend={formatTrend(summary.formSubmissionsTrend)}
          trendPositive={summary.formSubmissionsTrend >= 0}
          comparisonSecondary={a.vsPrevious}
        />
        <DashboardMetricCard
          icon={Wallet}
          label={a.metricWalletSpent}
          value={formatCount(summary.walletSpent)}
          comparisonPrimary={a.metricWalletSpentHint}
          trend={formatTrend(summary.walletSpentTrend)}
          trendPositive={summary.walletSpentTrend <= 0}
          comparisonSecondary={a.vsPrevious}
        />
        <DashboardMetricCard
          icon={Wallet}
          label={a.metricWalletBalance}
          value={formatCount(summary.walletBalance)}
          comparisonPrimary={summary.walletCurrency}
          comparisonSecondary={`${a.metricApiLifetime}: ${formatCount(summary.apiRequestsLifetime)}`}
        />
      </div>

      <AnalyticsTrendChart
        data={data.dailyTrend}
        locale={isRtl ? 'ar' : 'en'}
        labels={{
          title: a.chartTitle,
          description: a.chartDesc,
          seriesMessages: a.seriesMessages,
          seriesApi: a.seriesApi,
          seriesFormViews: a.seriesFormViews,
          seriesFormSubmissions: a.seriesFormSubmissions,
          seriesWallet: a.seriesWallet,
          total: a.chartTotal,
          dailyAvg: a.chartDailyAvg,
          peak: a.chartPeak,
          activeDays: a.chartActiveDays,
          empty: a.chartEmpty,
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="dashboard-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {a.breakdownTitle}
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                {a.breakdownDesc}
              </p>
            </div>
            <Link
              href={appWhatsapp(publicAppId)}
              className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              WhatsApp
            </Link>
          </div>
          {hasMessageBreakdown ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <AnalyticsBreakdownList
                title={a.byStatus}
                items={data.messagesByStatus}
                emptyLabel={a.emptyBreakdown}
              />
              <AnalyticsBreakdownList
                title={a.byType}
                items={data.messagesByType}
                emptyLabel={a.emptyBreakdown}
              />
              <AnalyticsBreakdownList
                title={a.byDirection}
                items={data.messagesByDirection}
                emptyLabel={a.emptyBreakdown}
              />
            </div>
          ) : (
            <p className="text-[13px] text-[var(--muted-foreground)]">
              {a.emptyBreakdown}
            </p>
          )}
        </section>

        <section className="dashboard-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {a.resourcesTitle}
            </h2>
            <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
              {a.resourcesDesc}
            </p>
          </div>
          <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3">
            {(
              [
                {
                  icon: KeyRound,
                  label: a.resourceKeys,
                  value: `${summary.activeApiKeys}/${summary.totalApiKeys}`,
                  hint: a.resourceKeysHint,
                  href: appApiKeys(publicAppId),
                },
                {
                  icon: FileText,
                  label: a.resourceForms,
                  value: formatCount(summary.linkedForms),
                  hint: a.resourceFormsHint,
                  href: appForms(publicAppId),
                },
                {
                  icon: MessageSquare,
                  label: a.resourceWhatsapp,
                  value: formatCount(summary.whatsappAccounts),
                  hint: a.resourceWhatsappHint,
                  href: appWhatsapp(publicAppId),
                },
                {
                  icon: Wallet,
                  label: a.resourceAllocated,
                  value: formatCount(summary.walletTotalAllocated),
                  hint: summary.walletCurrency,
                  href: appWallet(publicAppId),
                },
                {
                  icon: Wallet,
                  label: a.resourceSpentLifetime,
                  value: formatCount(summary.walletTotalSpent),
                  hint: summary.walletCurrency,
                  href: appWallet(publicAppId),
                },
                {
                  icon: AlertTriangle,
                  label: a.metricFailed,
                  value: formatCount(summary.messagesFailed),
                  hint: a.resourceFailedHint,
                  href: appWhatsapp(publicAppId),
                },
              ] as {
                icon: LucideIcon;
                label: string;
                value: string;
                hint: string;
                href: string;
              }[]
            ).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex min-h-[6.5rem] flex-col rounded-2xl bg-[var(--surface-secondary)] p-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_82%,var(--foreground)_4%)] sm:min-h-[7rem] sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium leading-snug text-[var(--muted-foreground)]">
                      {item.label}
                    </p>
                    <Icon
                      className="size-4 shrink-0 text-[var(--muted-foreground)]/75 transition-colors group-hover:text-[var(--foreground)]"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <p
                    className="mt-2.5 text-[1.45rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)] sm:text-[1.6rem]"
                    dir="ltr"
                    lang="en"
                  >
                    {item.value}
                  </p>
                  <p className="mt-auto pt-2.5 text-[11.5px] leading-relaxed text-[var(--muted-foreground)]">
                    {item.hint}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="dashboard-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {a.keysTitle}
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                {a.keysDesc}
              </p>
            </div>
            <Link
              href={appApiKeys(publicAppId)}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <KeyRound className="size-3.5" />
              API
            </Link>
          </div>
          {data.topApiKeys.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-foreground)]">{a.keysEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-start text-[13px]">
                <thead>
                  <tr className="text-[var(--muted-foreground)]">
                    <th className="pb-2 font-medium">{a.colKey}</th>
                    <th className="pb-2 font-medium">{a.colRequests}</th>
                    <th className="pb-2 font-medium">{a.colLastUsed}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topApiKeys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-t border-[var(--border)]/40"
                    >
                      <td className="py-2.5 pe-3">
                        <p className="font-medium text-[var(--foreground)]">
                          {key.name}
                        </p>
                        <p
                          className="font-mono text-[11px] text-[var(--muted-foreground)]"
                          dir="ltr"
                        >
                          {key.slug} · {key.environment}
                        </p>
                      </td>
                      <td
                        className="py-2.5 pe-3 tabular-nums text-[var(--foreground)]"
                        dir="ltr"
                        lang="en"
                      >
                        {formatCount(key.requestCount)}
                      </td>
                      <td
                        className="py-2.5 text-[var(--muted-foreground)]"
                        dir="ltr"
                        lang="en"
                      >
                        {formatDateTime(key.lastUsedAt, a.never)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dashboard-panel rounded-2xl p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                {a.formsTitle}
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                {a.formsDesc}
              </p>
            </div>
            <Link
              href={appForms(publicAppId)}
              className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              Forms
            </Link>
          </div>
          {data.topForms.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-foreground)]">
              {a.formsEmpty}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-start text-[13px]">
                <thead>
                  <tr className="text-[var(--muted-foreground)]">
                    <th className="pb-2 font-medium">{a.colForm}</th>
                    <th className="pb-2 font-medium">{a.colViews}</th>
                    <th className="pb-2 font-medium">{a.colSubmissions}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topForms.map((form) => (
                    <tr
                      key={form.id}
                      className="border-t border-[var(--border)]/40"
                    >
                      <td className="py-2.5 pe-3">
                        <p className="font-medium text-[var(--foreground)]">
                          {form.title}
                        </p>
                        <p
                          className="font-mono text-[11px] text-[var(--muted-foreground)]"
                          dir="ltr"
                        >
                          {form.slug}
                        </p>
                      </td>
                      <td
                        className="py-2.5 pe-3 tabular-nums text-[var(--foreground)]"
                        dir="ltr"
                        lang="en"
                      >
                        {formatCount(form.views)}
                      </td>
                      <td
                        className="py-2.5 tabular-nums text-[var(--foreground)]"
                        dir="ltr"
                        lang="en"
                      >
                        {formatCount(form.submissions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
