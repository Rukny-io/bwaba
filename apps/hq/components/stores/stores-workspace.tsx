'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  AdminStoreCategory,
  StoresListQuery,
  StoresListResponse,
  StoresStats,
} from '@/lib/types/stores';
import {
  buildStoresSearchParams,
  parseStoresQuery,
  STORES_DEFAULT_LIMIT,
} from '@/lib/stores-query';
import { StoresStatsStrip } from '@/components/stores/stores-stats-strip';
import { StoresFilters } from '@/components/stores/stores-filters';
import { StoresTable } from '@/components/stores/stores-table';

export function StoresWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = parseStoresQuery(searchParams);

  const [list, setList] = useState<StoresListResponse | null>(null);
  const [stats, setStats] = useState<StoresStats | null>(null);
  const [categories, setCategories] = useState<AdminStoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query.search ?? '');

  const skipSearchDebounce = useRef(false);

  const updateQuery = useCallback(
    (patch: Partial<StoresListQuery>) => {
      const current = parseStoresQuery(searchParams);
      const next = { ...current, ...patch };
      const params = buildStoresSearchParams(next);
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
    const currentQuery = parseStoresQuery(searchParams);
    setLoading(true);
    try {
      const [storesRes, statsRes, categoriesRes] = await Promise.all([
        hqApi.getStores(currentQuery),
        hqApi.getStoreStats(),
        hqApi.getStoreCategories(),
      ]);
      setList(storesRes);
      setStats(statsRes);
      setCategories(categoriesRes);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load stores',
      );
    } finally {
      setLoading(false);
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

  return (
    <div className="dashboard-section-stack">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          Stores
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Browse platform stores, owners, and store categories.
        </p>
      </header>

      <StoresStatsStrip stats={stats} />

      <StoresFilters
        search={searchInput}
        query={query}
        categories={categories}
        cities={stats?.byCity ?? []}
        isSearchPending={isSearchPending}
        onSearchChange={setSearchInput}
        onSearchCommit={commitSearch}
        onQueryChange={updateQuery}
      />

      <StoresTable
        stores={list?.data ?? []}
        isLoading={loading}
        page={list?.page ?? query.page ?? 1}
        pageSize={list?.limit ?? query.limit ?? STORES_DEFAULT_LIMIT}
        total={list?.total ?? 0}
        onPageChange={(page) => updateQuery({ page })}
      />
    </div>
  );
}
