'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  FileText,
  KeyRound,
  Link2,
  Plus,
  Wallet,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useAppDashboard } from '@/hooks/use-app-dashboard';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { DashboardQuickAction } from '@/components/dashboard/dashboard-quick-action';
import {
  DashboardHomeActivity,
  DashboardHomeIntegrations,
  DashboardHomeRecentKeys,
  buildDashboardActivity,
} from '@/components/dashboard/dashboard-home-panels';
import {
  appApiKeys,
  appApiKeysNew,
  appForms,
  appWhatsapp,
} from '@/lib/app-routes';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

interface AppDashboardProps {
  publicAppId: string;
  internalAppId: string;
}

export function AppDashboard({
  publicAppId,
  internalAppId,
}: AppDashboardProps) {
  const t = useTranslations();
  const d = t.dashboard;
  const isRtl = t.common.switchLang === 'English';
  const locale = isRtl ? 'ar' : 'en';

  const { data, isLoading } = useAppDashboard(publicAppId, internalAppId);
  const statPlaceholder = isLoading ? '…' : '—';

  const apiRequests = data
    ? formatCount(data.totalRequests)
    : statPlaceholder;
  const activeKeys = data
    ? formatCount(data.activeKeysCount)
    : statPlaceholder;
  const walletBalance = data?.wallet
    ? formatBalance(data.wallet.balance)
    : statPlaceholder;
  const integrationCount = data
    ? formatCount(
        data.accounts.length + (data.formsSummary?.linkedCount ?? 0),
      )
    : statPlaceholder;

  const panelLabels = {
    viewAll: d.panelViewAll,
    recentKeys: d.panelRecentKeys,
    recentKeysEmptyTitle: d.panelRecentKeysEmptyTitle,
    recentKeysEmptyDesc: d.panelRecentKeysEmptyDesc,
    createKey: d.createKey,
    integrations: d.panelIntegrations,
    integrationsEmptyTitle: d.panelIntegrationsEmptyTitle,
    integrationsEmptyDesc: d.panelIntegrationsEmptyDesc,
    connectWhatsapp: d.connectWhatsapp,
    activity: d.panelActivity,
    activityEmptyTitle: d.panelActivityEmptyTitle,
    activityEmptyDesc: d.panelActivityEmptyDesc,
    keyActive: d.active,
    keyInactive: d.keyInactive,
    requests: d.apiRequests,
    linkedForm: d.linkedForm,
    submissions: d.submissions,
  };

  const activity = useMemo(
    () =>
      buildDashboardActivity({
        publicAppId,
        keys: data?.keys ?? [],
        accounts: data?.accounts ?? [],
        linkedForms: data?.linkedForms ?? [],
        labels: {
          keyCreated: d.activityKeyCreated,
          keyUsed: d.activityKeyUsed,
          whatsappConnected: d.activityWhatsappConnected,
          formLinked: d.activityFormLinked,
        },
      }),
    [data, d, publicAppId],
  );

  return (
    <>
      <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 xl:grid-cols-4">
        <DashboardMetricCard
          icon={Activity}
          label={d.apiRequests}
          value={apiRequests}
          comparisonPrimary={d.allTime}
          comparisonSecondary={d.metricRequestsHint}
        />
        <DashboardMetricCard
          icon={KeyRound}
          label={d.apiKeys}
          value={activeKeys}
          comparisonPrimary={d.active}
          comparisonSecondary={d.metricKeysHint}
        />
        <DashboardMetricCard
          icon={Link2}
          label={d.integrations}
          value={integrationCount}
          comparisonPrimary={d.connected}
          comparisonSecondary={d.metricIntegrationsHint}
        />
        <DashboardMetricCard
          icon={Wallet}
          label={t.topbar.walletBalance}
          value={walletBalance}
          comparisonPrimary={d.iqd}
          comparisonSecondary={d.metricWalletHint}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardHomeRecentKeys
          publicAppId={publicAppId}
          keys={data?.keys ?? []}
          labels={panelLabels}
          isRtl={isRtl}
          locale={locale}
        />
        <DashboardHomeIntegrations
          publicAppId={publicAppId}
          accounts={data?.accounts ?? []}
          linkedForms={data?.linkedForms ?? []}
          labels={panelLabels}
          isRtl={isRtl}
          locale={locale}
        />
        <DashboardHomeActivity
          publicAppId={publicAppId}
          items={activity}
          labels={panelLabels}
          isRtl={isRtl}
          locale={locale}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
        <DashboardQuickAction
          href={appApiKeys(publicAppId)}
          icon={KeyRound}
          title={d.actionKeys}
          description={d.actionKeysDesc}
          isRtl={isRtl}
        />
        <DashboardQuickAction
          href={appForms(publicAppId)}
          icon={FileText}
          title={d.actionForms}
          description={d.actionFormsDesc}
          isRtl={isRtl}
        />
        <DashboardQuickAction
          href={appWhatsapp(publicAppId)}
          icon={Link2}
          title={d.actionIntegrations}
          description={d.actionIntegrationsDesc}
          isRtl={isRtl}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>
    </>
  );
}

export function AppDashboardCreateKeyAction({
  publicAppId,
}: {
  publicAppId: string;
}) {
  const d = useTranslations().dashboard;
  return (
    <Link
      href={appApiKeysNew(publicAppId)}
      className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
    >
      <Plus size={15} strokeWidth={2.2} />
      {d.createKey}
    </Link>
  );
}
