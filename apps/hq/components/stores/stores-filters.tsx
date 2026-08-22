'use client';

import Link from 'next/link';
import { FolderTree, Loader2, X } from 'lucide-react';
import { SearchField } from '@heroui/react';
import { STORE_STATUS_OPTIONS } from '@/lib/stores-format';
import { formatCategoryLabel } from '@/lib/stores-format';
import type { AdminStoreCategory, StoresListQuery } from '@/lib/types/stores';
import { FilterDropdown } from '@/components/shared/filter-dropdown';

interface StoresFiltersProps {
  search: string;
  query: StoresListQuery;
  categories: AdminStoreCategory[];
  cities: { city: string; count: number }[];
  isSearchPending?: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  onQueryChange: (patch: Partial<StoresListQuery>) => void;
}

export function StoresFilters({
  search,
  query,
  categories,
  cities,
  isSearchPending,
  onSearchChange,
  onSearchCommit,
  onQueryChange,
}: StoresFiltersProps) {
  const categoryOptions = [
    { value: '', label: 'Category' },
    ...categories
      .filter((c) => c.isActive)
      .map((c) => ({
        value: c.id,
        label: formatCategoryLabel(c),
      })),
  ];

  const cityOptions = [
    { value: '', label: 'City' },
    ...cities.map((c) => ({
      value: c.city,
      label: `${c.city} (${c.count})`,
    })),
  ];

  const statusOptions = STORE_STATUS_OPTIONS.map((option) =>
    option.value === '' ? { ...option, label: 'Status' } : option,
  );

  const hasActiveFilters = Boolean(
    query.search || query.status || query.categoryId || query.city,
  );

  function handleClearAll() {
    onSearchChange('');
    onQueryChange({
      search: undefined,
      status: undefined,
      categoryId: undefined,
      city: undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField
        fullWidth
        aria-label="Search stores"
        name="stores-search"
        value={search}
        onChange={onSearchChange}
        onSubmit={onSearchCommit}
        className="min-w-0 sm:max-w-sm"
      >
        <SearchField.Group className="h-8 rounded-lg border-0 bg-[var(--surface-secondary)]">
          <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
          <SearchField.Input
            placeholder="Search stores…"
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
          label="Filter by status"
          value={query.status ?? ''}
          options={statusOptions}
          onChange={(status) =>
            onQueryChange({
              status: (status || undefined) as StoresListQuery['status'],
              page: 1,
            })
          }
        />

        <FilterDropdown
          size="sm"
          label="Filter by category"
          value={query.categoryId ?? ''}
          options={categoryOptions}
          onChange={(categoryId) =>
            onQueryChange({
              categoryId: categoryId || undefined,
              page: 1,
            })
          }
        />

        <FilterDropdown
          size="sm"
          label="Filter by city"
          value={query.city ?? ''}
          options={cityOptions}
          onChange={(city) =>
            onQueryChange({
              city: city || undefined,
              page: 1,
            })
          }
        />

        <Link
          href="/app/stores/categories"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
        >
          <FolderTree className="size-3.5" />
          Manage
        </Link>

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
