'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
  Globe,
  Inbox,
  LayoutDashboard,
  Loader2,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  AdminMailAppDetail,
  AdminMailMailbox,
  MailAnalyticsResponse,
  MailDeliveryListResponse,
} from '@/lib/types/mail';
import {
  formatMailAppStatus,
  formatMailDomainStatus,
  mailAppStatusChipColor,
  mailDomainStatusChipColor,
} from '@/lib/mail-format';
import {
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { MailAppOverviewPanel } from '@/components/mail/mail-app-overview-panel';
import { MailAppMailboxesPanel } from '@/components/mail/mail-app-mailboxes-panel';
import { MailAppSubscriptionPanel } from '@/components/mail/mail-app-subscription-panel';
import { MailAppDomainPanel } from '@/components/mail/mail-app-domain-panel';
import { MailDeliveryTable } from '@/components/mail/mail-delivery-table';
import { MailAnalyticsPanel } from '@/components/mail/mail-analytics-panel';

type MailDetailTab =
  | 'overview'
  | 'analytics'
  | 'mailboxes'
  | 'subscription'
  | 'domain'
  | 'delivery';

const TAB_IDS: MailDetailTab[] = [
  'overview',
  'analytics',
  'mailboxes',
  'subscription',
  'domain',
  'delivery',
];

const TABS: { id: MailDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Details', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'mailboxes', label: 'Mailboxes', icon: Inbox },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'domain', label: 'Domain', icon: Globe },
  { id: 'delivery', label: 'Delivery', icon: Mail },
];

function parseTabParam(value: string | null): MailDetailTab {
  if (value && TAB_IDS.includes(value as MailDetailTab)) {
    return value as MailDetailTab;
  }
  return 'overview';
}

export function MailAppDetailView({ appId }: { appId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [app, setApp] = useState<AdminMailAppDetail | null>(null);
  const [mailboxes, setMailboxes] = useState<AdminMailMailbox[]>([]);
  const [delivery, setDelivery] = useState<MailDeliveryListResponse | null>(null);
  const [analytics, setAnalytics] = useState<MailAnalyticsResponse | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [boxesLoading, setBoxesLoading] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [activeTab, setActiveTab] = useState<MailDetailTab>(() =>
    parseTabParam(searchParams.get('tab')),
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const loadApp = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await hqApi.getMailApp(appId);
      setApp(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load this Mail app',
      );
      router.replace('/app/mail');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [appId, router]);

  const loadMailboxes = useCallback(async () => {
    setBoxesLoading(true);
    try {
      const result = await hqApi.getMailAppMailboxes(appId);
      setMailboxes(result.mailboxes);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load mailboxes',
      );
    } finally {
      setBoxesLoading(false);
    }
  }, [appId]);

  const loadDelivery = useCallback(
    async (page: number) => {
      setDeliveryLoading(true);
      try {
        const result = await hqApi.getMailDelivery({
          appId,
          page,
          limit: 20,
          days: 30,
        });
        setDelivery(result);
      } catch (error) {
        appToast.error(
          error instanceof ApiException ? error.message : 'Could not load delivery',
        );
      } finally {
        setDeliveryLoading(false);
      }
    },
    [appId],
  );

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await hqApi.getMailAppAnalytics(appId, { days: analyticsDays }));
    } catch (error) {
      setAnalytics(null);
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load analytics',
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [appId, analyticsDays]);

  useEffect(() => {
    void loadApp();
  }, [loadApp]);

  useEffect(() => {
    if (activeTab === 'mailboxes') void loadMailboxes();
    if (activeTab === 'delivery') void loadDelivery(deliveryPage);
    if (activeTab === 'analytics') void loadAnalytics();
  }, [activeTab, deliveryPage, loadMailboxes, loadDelivery, loadAnalytics]);

  function setTab(tab: MailDetailTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (loading || !app) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/app/mail"
            className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Mail
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Chip color={mailAppStatusChipColor(app.status)} size="sm" variant="soft">
              {formatMailAppStatus(app.status)}
            </Chip>
            <Chip
              color={mailDomainStatusChipColor(app.domainStatus)}
              size="sm"
              variant="soft"
            >
              {formatMailDomainStatus(app.domainStatus)}
            </Chip>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Mail className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 max-w-lg">
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {app.name}
            </h1>
            <p className="mt-0.5 truncate font-mono text-sm text-[var(--muted-foreground)]" dir="ltr">
              {app.appId}
            </p>
            {app.primaryDomain ? (
              <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]" dir="ltr">
                {app.primaryDomain}
              </p>
            ) : null}
          </div>
        </div>

        <nav
          className={workspaceTabGroupClassName}
          aria-label="App sections"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(tab.id)}
                className={workspaceTabClassName(isActive)}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div role="tabpanel">
        {activeTab === 'overview' ? <MailAppOverviewPanel app={app} /> : null}
        {activeTab === 'analytics' ? (
          <MailAnalyticsPanel
            data={analytics}
            loading={analyticsLoading}
            days={analyticsDays}
            onDaysChange={setAnalyticsDays}
            title={`${app.name} analytics`}
            description="Traffic for this app only. Message bodies are never shown."
            showDistribution={false}
          />
        ) : null}
        {activeTab === 'mailboxes' ? (
          <MailAppMailboxesPanel
            mailboxes={mailboxes}
            loading={boxesLoading}
            onChanged={async () => {
              await loadMailboxes();
              await loadApp({ silent: true });
            }}
          />
        ) : null}
        {activeTab === 'subscription' ? (
          <MailAppSubscriptionPanel app={app} onActivated={() => loadApp({ silent: true })} />
        ) : null}
        {activeTab === 'domain' ? (
          <MailAppDomainPanel app={app} onRefreshed={() => loadApp({ silent: true })} />
        ) : null}
        {activeTab === 'delivery' ? (
          <MailDeliveryTable
            items={delivery?.data ?? []}
            isLoading={deliveryLoading}
            page={delivery?.page ?? deliveryPage}
            pageSize={delivery?.limit ?? 20}
            total={delivery?.total ?? 0}
            onPageChange={setDeliveryPage}
          />
        ) : null}
      </div>
    </div>
  );
}
