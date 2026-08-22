'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Globe, Inbox, Mail, TriangleAlert } from 'lucide-react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { downloadCsv } from '@/lib/export-csv';
import type {
  MailAlertsResponse,
  MailAnalyticsResponse,
  MailAppsListQuery,
  MailAppsListResponse,
  MailDeliveryListResponse,
  MailDomainsResponse,
  MailStats,
  MailWorkspaceTab,
} from '@/lib/types/mail';
import {
  buildMailSearchParams,
  MAIL_DEFAULT_LIMIT,
  parseMailQuery,
} from '@/lib/mail-query';
import {
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { MailStatsStrip } from '@/components/mail/mail-stats-strip';
import { MailAnalyticsPanel } from '@/components/mail/mail-analytics-panel';
import { MailFilters } from '@/components/mail/mail-filters';
import { MailAppsTable } from '@/components/mail/mail-apps-table';
import { MailDeliveryTable } from '@/components/mail/mail-delivery-table';
import { MailDomainsPanel } from '@/components/mail/mail-domains-panel';
import { MailAlertsPanel } from '@/components/mail/mail-alerts-panel';

const TABS: { id: MailWorkspaceTab; label: string; icon: typeof Mail }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'review', label: 'Apps', icon: Inbox },
  { id: 'delivery', label: 'Delivery', icon: Mail },
  { id: 'alerts', label: 'Alerts', icon: TriangleAlert },
];

export function MailWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = parseMailQuery(searchParams);
  const tab = query.tab ?? 'review';

  const [list, setList] = useState<MailAppsListResponse | null>(null);
  const [stats, setStats] = useState<MailStats | null>(null);
  const [analytics, setAnalytics] = useState<MailAnalyticsResponse | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [domains, setDomains] = useState<MailDomainsResponse | null>(null);
  const [alerts, setAlerts] = useState<MailAlertsResponse | null>(null);
  const [delivery, setDelivery] = useState<MailDeliveryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState(query.search ?? '');
  const skipSearchDebounce = useRef(false);

  const updateQuery = useCallback(
    (patch: Partial<MailAppsListQuery>) => {
      const current = parseMailQuery(searchParams);
      const next = { ...current, ...patch };
      const params = buildMailSearchParams(next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const isSearchPending = searchInput.trim() !== (query.search ?? '');

  const commitSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if ((query.search ?? '') === trimmed) return;
    updateQuery({ search: trimmed || undefined, page: 1 });
  }, [searchInput, query.search, updateQuery]);

  const loadData = useCallback(async () => {
    const currentQuery = parseMailQuery(searchParams);
    const currentTab = currentQuery.tab ?? 'review';
    setLoading(true);
    try {
      const [statsRes] = await Promise.all([hqApi.getMailStats()]);
      setStats(statsRes);

      if (currentTab === 'review') {
        const appsRes = await hqApi.getMailApps(currentQuery);
        setList(appsRes);
      } else if (currentTab === 'domains') {
        setDomains(await hqApi.getMailDomains());
      } else if (currentTab === 'alerts') {
        setAlerts(await hqApi.getMailAlerts());
      } else if (currentTab === 'delivery') {
        setDelivery(
          await hqApi.getMailDelivery({
            page: currentQuery.page,
            limit: currentQuery.limit,
            days: 30,
          }),
        );
      }
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load Mail data',
      );
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      setAnalytics(await hqApi.getMailAnalytics({ days: analyticsDays }));
    } catch {
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsDays]);

  useEffect(() => {
    void loadData();
  }, [queryKey, loadData]);

  useEffect(() => {
    if (tab === 'analytics') {
      void loadAnalytics();
    }
  }, [tab, loadAnalytics]);

  useEffect(() => {
    if (skipSearchDebounce.current) {
      skipSearchDebounce.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if ((query.search ?? '') === trimmed) return;
      updateQuery({ search: trimmed || undefined, page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, query.search, updateQuery]);

  useEffect(() => {
    setSearchInput(query.search ?? '');
    skipSearchDebounce.current = true;
  }, [query.search]);

  async function handleExport() {
    setExporting(true);
    try {
      const currentQuery = parseMailQuery(searchParams);
      const { page: _page, limit: _limit, tab: _tab, ...exportQuery } = currentQuery;
      const result = await hqApi.exportMailApps(exportQuery);
      if (!result.data.length) {
        appToast.info('Nothing to export');
        return;
      }
      downloadCsv(
        `rukny-mail-${new Date().toISOString().slice(0, 10)}.csv`,
        result.data,
      );
      appToast.success(`Exported ${result.total} apps`);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not export',
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="dashboard-section-stack">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          Mail
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Operational review of apps, mailboxes, domain verification, and delivery.
        </p>
      </header>

      <MailStatsStrip stats={stats} />

      <div className={workspaceTabGroupClassName}>
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={workspaceTabClassName(active)}
              onClick={() => updateQuery({ tab: item.id, page: 1 })}
            >
              <Icon className="size-3.5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'analytics' ? (
        <MailAnalyticsPanel
          data={analytics}
          loading={analyticsLoading}
          days={analyticsDays}
          onDaysChange={setAnalyticsDays}
          title="Platform analytics"
          description="All Mail apps. Open an app for per-app traffic and mailbox breakdown."
        />
      ) : null}

      {tab === 'review' ? (
        <>
          <MailFilters
            search={searchInput}
            query={query}
            isSearchPending={isSearchPending}
            isExporting={exporting}
            onSearchChange={setSearchInput}
            onSearchCommit={commitSearch}
            onQueryChange={updateQuery}
            onExport={() => void handleExport()}
          />
          <MailAppsTable
            apps={list?.data ?? []}
            isLoading={loading}
            page={list?.page ?? query.page ?? 1}
            pageSize={list?.limit ?? query.limit ?? MAIL_DEFAULT_LIMIT}
            total={list?.total ?? 0}
            onPageChange={(page) => updateQuery({ page })}
          />
        </>
      ) : null}

      {tab === 'domains' ? <MailDomainsPanel data={domains} loading={loading} /> : null}

      {tab === 'delivery' ? (
        <MailDeliveryTable
          items={delivery?.data ?? []}
          isLoading={loading}
          page={delivery?.page ?? query.page ?? 1}
          pageSize={delivery?.limit ?? query.limit ?? MAIL_DEFAULT_LIMIT}
          total={delivery?.total ?? 0}
          onPageChange={(page) => updateQuery({ page })}
        />
      ) : null}

      {tab === 'alerts' ? <MailAlertsPanel data={alerts} loading={loading} /> : null}
    </div>
  );
}
