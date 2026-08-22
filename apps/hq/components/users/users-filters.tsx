'use client';

import { Download, Loader2, X } from 'lucide-react';
import { SearchField } from '@heroui/react';
import type { UsersListQuery } from '@/lib/types/users';
import { ROLE_OPTIONS, VERIFIED_FILTER_OPTIONS } from '@/lib/users-format';
import { FilterDropdown } from '@/components/shared/filter-dropdown';

interface UsersFiltersProps {
  search: string;
  query: UsersListQuery;
  isExporting?: boolean;
  isSearchPending?: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  onQueryChange: (patch: Partial<UsersListQuery>) => void;
  onExport: () => void;
}

export function UsersFilters({
  search,
  query,
  isExporting,
  isSearchPending,
  onSearchChange,
  onSearchCommit,
  onQueryChange,
  onExport,
}: UsersFiltersProps) {
  const hasActiveFilters = Boolean(query.search || query.role || query.emailVerified);

  const roleOptions = ROLE_OPTIONS.map((option) =>
    option.value === '' ? { ...option, label: 'Role' } : option,
  );

  const statusOptions = VERIFIED_FILTER_OPTIONS.map((option) =>
    option.value === '' ? { ...option, label: 'Status' } : option,
  );

  function handleClearAll() {
    onSearchChange('');
    onQueryChange({
      search: undefined,
      role: undefined,
      emailVerified: undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField
        fullWidth
        aria-label="Search users"
        name="users-search"
        value={search}
        onChange={onSearchChange}
        onSubmit={onSearchCommit}
        className="min-w-0 sm:max-w-sm"
      >
        <SearchField.Group className="h-8 rounded-lg border-0 bg-[var(--surface-secondary)]">
          <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
          <SearchField.Input
            placeholder="Search users…"
            className="text-xs placeholder:text-[var(--muted-foreground)] sm:text-[13px]"
          />
          {isSearchPending ? (
            <span className="me-1.5 flex size-6 items-center justify-center text-[var(--muted-foreground)]">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            </span>
          ) : (
            <SearchField.ClearButton />
          )}
        </SearchField.Group>
      </SearchField>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <FilterDropdown
          size="sm"
          label="Filter by role"
          value={query.role ?? ''}
          options={roleOptions}
          onChange={(role) =>
            onQueryChange({
              role: (role || undefined) as UsersListQuery['role'],
              page: 1,
            })
          }
        />

        <FilterDropdown
          size="sm"
          label="Filter by verification"
          value={query.emailVerified ?? ''}
          options={statusOptions}
          onChange={(emailVerified) =>
            onQueryChange({
              emailVerified: (emailVerified ||
                undefined) as UsersListQuery['emailVerified'],
              page: 1,
            })
          }
        />

        <button
          type="button"
          disabled={isExporting}
          onClick={onExport}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Export
        </button>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            <X className="size-3.5" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
