'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { downloadCsv } from '@/lib/export-csv';
import type { UsersListQuery, UsersListResponse, UsersStats } from '@/lib/types/users';
import {
  buildUsersSearchParams,
  parseUsersQuery,
  USERS_DEFAULT_LIMIT,
} from '@/lib/users-query';
import { UsersStatsStrip } from '@/components/users/users-stats-strip';
import { UsersFilters } from '@/components/users/users-filters';
import { UsersTable } from '@/components/users/users-table';

export function UsersWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const query = parseUsersQuery(searchParams);

  const [list, setList] = useState<UsersListResponse | null>(null);
  const [stats, setStats] = useState<UsersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchInput, setSearchInput] = useState(query.search ?? '');

  const skipSearchDebounce = useRef(false);

  const updateQuery = useCallback(
    (patch: Partial<UsersListQuery>) => {
      const current = parseUsersQuery(searchParams);
      const next = { ...current, ...patch };
      const params = buildUsersSearchParams(next);
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
    const currentQuery = parseUsersQuery(searchParams);
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        hqApi.getUsers(currentQuery),
        hqApi.getUsersStats(),
      ]);
      setList(usersRes);
      setStats(statsRes);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load users',
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

  async function handleExport() {
    setExporting(true);
    try {
      const result = await hqApi.exportUsers(query);
      if (!result.data.length) {
        appToast.info('No data to export');
        return;
      }
      downloadCsv(
        `rukny-users-${new Date().toISOString().slice(0, 10)}.csv`,
        result.data,
        [
          { key: 'email', label: 'email' },
          { key: 'name', label: 'name' },
          { key: 'username', label: 'username' },
          { key: 'phone', label: 'phone' },
          { key: 'role', label: 'role' },
          { key: 'emailVerified', label: 'emailVerified' },
          { key: 'phoneVerified', label: 'phoneVerified' },
          { key: 'verificationLevel', label: 'verificationLevel' },
          { key: 'isRuknyVerified', label: 'isRuknyVerified' },
          { key: 'twoFactorEnabled', label: 'twoFactorEnabled' },
          { key: 'isDeactivated', label: 'isDeactivated' },
          { key: 'subscriptionPlan', label: 'subscriptionPlan' },
          { key: 'createdAt', label: 'createdAt' },
          { key: 'lastLoginAt', label: 'lastLoginAt' },
        ],
      );
      appToast.success(`Exported ${result.total} users`);
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
          Users
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          Manage Rukny platform accounts, roles, and sessions.
        </p>
      </header>

      <UsersStatsStrip stats={stats} />

      <UsersFilters
        search={searchInput}
        query={query}
        isExporting={exporting}
        isSearchPending={isSearchPending}
        onSearchChange={setSearchInput}
        onSearchCommit={commitSearch}
        onQueryChange={updateQuery}
        onExport={() => void handleExport()}
      />

      <UsersTable
        users={list?.data ?? []}
        isLoading={loading}
        page={list?.page ?? query.page ?? 1}
        pageSize={list?.limit ?? query.limit ?? USERS_DEFAULT_LIMIT}
        total={list?.total ?? 0}
        onPageChange={(page) => updateQuery({ page })}
        onRefresh={() => void loadData()}
      />
    </div>
  );
}
