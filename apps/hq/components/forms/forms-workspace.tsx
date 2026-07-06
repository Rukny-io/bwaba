'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  FormsAnalyticsResponse,
  FormsListQuery,
  FormsListResponse,
  FormsStats,
} from '@/lib/types/forms';
import {
  buildFormsSearchParams,
  FORMS_DEFAULT_LIMIT,
  parseFormsQuery,
} from '@/lib/forms-query';
import { downloadCsv } from '@/lib/export-csv';
import { FormsStatsStrip } from '@/components/forms/forms-stats-strip';
import { FormsAnalyticsPanel } from '@/components/forms/forms-analytics-panel';
import { FormsFilters } from '@/components/forms/forms-filters';
import { FormsTable } from '@/components/forms/forms-table';

export function FormsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = parseFormsQuery(searchParams);

  const [list, setList] = useState<FormsListResponse | null>(null);
  const [stats, setStats] = useState<FormsStats | null>(null);
  const [analytics, setAnalytics] = useState<FormsAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState(query.search ?? '');

  const skipSearchDebounce = useRef(false);

  const updateQuery = useCallback(
    (patch: Partial<FormsListQuery>) => {
      const current = parseFormsQuery(searchParams);
      const next = { ...current, ...patch };
      const params = buildFormsSearchParams(next);
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
    const currentQuery = parseFormsQuery(searchParams);
    setLoading(true);
    setAnalyticsLoading(true);
    try {
      const [formsRes, statsRes, analyticsRes] = await Promise.all([
        hqApi.getForms(currentQuery),
        hqApi.getFormsStats(),
        hqApi.getFormsAnalytics({ days: 7, staleDays: 30, limit: 8 }),
      ]);
      setList(formsRes);
      setStats(statsRes);
      setAnalytics(analyticsRes);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load forms',
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

  async function handleExport() {
    setExporting(true);
    try {
      const currentQuery = parseFormsQuery(searchParams);
      const { page: _page, limit: _limit, ...exportQuery } = currentQuery;
      const result = await hqApi.exportForms(exportQuery);
      if (!result.data.length) {
        appToast.info('No data to export');
        return;
      }
      downloadCsv(
        `rukny-forms-${new Date().toISOString().slice(0, 10)}.csv`,
        result.data,
        [
          { key: 'title', label: 'title' },
          { key: 'slug', label: 'slug' },
          { key: 'status', label: 'status' },
          { key: 'type', label: 'type' },
          { key: 'viewCount', label: 'viewCount' },
          { key: 'submissionCount', label: 'submissionCount' },
          { key: 'ownerEmail', label: 'ownerEmail' },
          { key: 'ownerName', label: 'ownerName' },
          { key: 'ownerUsername', label: 'ownerUsername' },
          { key: 'createdAt', label: 'createdAt' },
          { key: 'updatedAt', label: 'updatedAt' },
          { key: 'deletedAt', label: 'deletedAt' },
          { key: 'purgeScheduledAt', label: 'purgeScheduledAt' },
        ],
      );
      appToast.success(`Exported ${result.total} forms`);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not export data',
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          Forms
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Browse platform forms — read-only overview with links to owners and previews.
        </p>
      </header>

      <FormsStatsStrip stats={stats} />

      <FormsAnalyticsPanel data={analytics} loading={analyticsLoading} />

      <FormsFilters
        search={searchInput}
        query={query}
        isSearchPending={isSearchPending}
        isExporting={exporting}
        onSearchChange={setSearchInput}
        onSearchCommit={commitSearch}
        onQueryChange={updateQuery}
        onExport={() => void handleExport()}
      />

      <FormsTable
        forms={list?.data ?? []}
        isLoading={loading}
        page={list?.page ?? query.page ?? 1}
        pageSize={list?.limit ?? query.limit ?? FORMS_DEFAULT_LIMIT}
        total={list?.total ?? 0}
        onPageChange={(page) => updateQuery({ page })}
      />
    </div>
  );
}
