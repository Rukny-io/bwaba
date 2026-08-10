'use client';

import Link from 'next/link';
import { FolderTree, X } from 'lucide-react';
import { Button, SearchField } from '@heroui/react';
import { Loader2 } from 'lucide-react';
import { STORE_STATUS_OPTIONS } from '@/lib/stores-format';
import { formatCategoryLabel } from '@/lib/stores-format';
import type { AdminStoreCategory, StoresListQuery } from '@/lib/types/stores';
import { FilterDropdown } from '@/components/shared/filter-dropdown';

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-2 py-1 text-xs text-[var(--foreground)]">
      <span className="max-w-[12rem] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-0.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-tertiary)] hover:text-[var(--foreground)]"
        aria-label={`Remove ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

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
    { value: '', label: 'All categories' },
    ...categories
      .filter((c) => c.isActive)
      .map((c) => ({
        value: c.id,
        label: formatCategoryLabel(c),
      })),
  ];

  const cityOptions = [
    { value: '', label: 'All cities' },
    ...cities.map((c) => ({
      value: c.city,
      label: `${c.city} (${c.count})`,
    })),
  ];

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

  const selectedCategory = categories.find((c) => c.id === query.categoryId);

  return (
    <div className="space-y-3 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)] sm:p-4 md:rounded-3xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField
            fullWidth
            aria-label="Search stores"
            name="stores-search"
            value={search}
            onChange={onSearchChange}
            onSubmit={onSearchCommit}
            className="min-w-0 flex-1"
          >
            <SearchField.Group className="h-10 rounded-xl border-0 bg-[var(--surface-secondary)] sm:border sm:border-[var(--border)] sm:bg-[var(--field-background)]">
              <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
              <SearchField.Input
                placeholder="Search by name, slug, or email…"
                className="text-sm placeholder:text-[var(--muted-foreground)]"
              />
              {isSearchPending ? (
                <span className="me-2 flex size-8 items-center justify-center text-[var(--muted-foreground)]">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                </span>
              ) : (
                <SearchField.ClearButton />
              )}
            </SearchField.Group>
          </SearchField>

          <Link
            href="/app/stores/categories"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <FolderTree className="size-4" />
            Categories
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterDropdown
            label="Filter by status"
            value={query.status ?? ''}
            options={STORE_STATUS_OPTIONS}
            className="w-full min-w-0"
            onChange={(status) =>
              onQueryChange({
                status: (status || undefined) as StoresListQuery['status'],
                page: 1,
              })
            }
          />

          <FilterDropdown
            label="Filter by category"
            value={query.categoryId ?? ''}
            options={categoryOptions}
            className="w-full min-w-0"
            onChange={(categoryId) =>
              onQueryChange({
                categoryId: categoryId || undefined,
                page: 1,
              })
            }
          />

          <FilterDropdown
            label="Filter by city"
            value={query.city ?? ''}
            options={cityOptions}
            className="w-full min-w-0 sm:max-w-[14rem]"
            onChange={(city) =>
              onQueryChange({
                city: city || undefined,
                page: 1,
              })
            }
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 pt-1 sm:border-t sm:border-[var(--border)]/60 sm:pt-3">
          <span className="text-[11px] font-medium text-[var(--muted-foreground)]">
            Active filters
          </span>

          {query.search ? (
            <FilterChip
              label={`Search: ${query.search}`}
              onRemove={() => {
                onSearchChange('');
                onQueryChange({ search: undefined, page: 1 });
              }}
            />
          ) : null}

          {query.status ? (
            <FilterChip
              label={
                STORE_STATUS_OPTIONS.find((o) => o.value === query.status)?.label ??
                'Status'
              }
              onRemove={() => onQueryChange({ status: undefined, page: 1 })}
            />
          ) : null}

          {selectedCategory ? (
            <FilterChip
              label={formatCategoryLabel(selectedCategory)}
              onRemove={() => onQueryChange({ categoryId: undefined, page: 1 })}
            />
          ) : null}

          {query.city ? (
            <FilterChip
              label={`City: ${query.city}`}
              onRemove={() => onQueryChange({ city: undefined, page: 1 })}
            />
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-xs text-[var(--muted-foreground)]"
            onPress={handleClearAll}
          >
            <X className="size-3.5" />
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
