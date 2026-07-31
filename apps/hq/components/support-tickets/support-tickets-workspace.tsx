'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  SupportTicketsListQuery,
  SupportTicketsListResponse,
  SupportTicketsStats,
} from '@/lib/types/support-tickets';
import {
  buildSupportTicketsSearchParams,
  parseSupportTicketsQuery,
  SUPPORT_TICKETS_DEFAULT_LIMIT,
} from '@/lib/support-tickets-query';
import { SupportTicketsAnalyticsPanel } from '@/components/support-tickets/support-tickets-analytics-panel';
import { SupportTicketsFilters } from '@/components/support-tickets/support-tickets-filters';
import { SupportTicketsStatsStrip } from '@/components/support-tickets/support-tickets-stats-strip';
import { SupportTicketsTable } from '@/components/support-tickets/support-tickets-table';
import { subscribeSupportSocket } from '@/lib/support-tickets-socket';

export function SupportTicketsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = parseSupportTicketsQuery(searchParams);

  const [list, setList] = useState<SupportTicketsListResponse | null>(null);
  const [stats, setStats] = useState<SupportTicketsStats | null>(null);
  const [adminOptions, setAdminOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query.search ?? '');
  const skipSearchDebounce = useRef(false);

  const updateQuery = useCallback(
    (patch: Partial<SupportTicketsListQuery>) => {
      const current = parseSupportTicketsQuery(searchParams);
      const next = { ...current, ...patch };
      const params = buildSupportTicketsSearchParams(next);
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
    const currentQuery = parseSupportTicketsQuery(searchParams);
    setLoading(true);
    setAnalyticsLoading(true);
    try {
      const [ticketsRes, statsRes, adminsRes] = await Promise.all([
        hqApi.getSupportTickets(currentQuery),
        hqApi.getSupportTicketStats(),
        hqApi.getUsers({ role: 'ADMIN', limit: 50 }),
      ]);
      setList(ticketsRes);
      setStats(statsRes);
      setAdminOptions(
        adminsRes.data.map((admin) => ({
          value: admin.id,
          label: admin.email,
        })),
      );
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not load support tickets',
      );
    } finally {
      setLoading(false);
      setAnalyticsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    void loadData();
  }, [queryKey, loadData]);

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

  useEffect(() => {
    const unsub = subscribeSupportSocket({
      onStaffActivity: (activity) => {
        appToast.info(`New customer message · ${activity.ticketNumber}`, {
          description: `${activity.subject} — ${activity.preview.slice(0, 120)}`,
        });
        void loadData();
      },
    });

    return unsub;
  }, [loadData]);

  return (
    <div className="dashboard-section-stack">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          Support
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Review and respond to user support tickets — queue overview and live conversation.
        </p>
      </header>

      <SupportTicketsStatsStrip stats={stats} />

      <SupportTicketsAnalyticsPanel
        stats={stats}
        tickets={list?.tickets ?? []}
        loading={analyticsLoading}
      />

      <SupportTicketsFilters
        query={query}
        adminOptions={adminOptions}
        search={searchInput}
        isSearchPending={isSearchPending}
        onSearchChange={setSearchInput}
        onSearchCommit={commitSearch}
        onQueryChange={updateQuery}
      />

      <SupportTicketsTable
        tickets={list?.tickets ?? []}
        isLoading={loading}
        page={list?.page ?? query.page ?? 1}
        pageSize={list?.limit ?? query.limit ?? SUPPORT_TICKETS_DEFAULT_LIMIT}
        total={list?.total ?? 0}
        onPageChange={(page) => updateQuery({ page })}
      />
    </div>
  );
}
