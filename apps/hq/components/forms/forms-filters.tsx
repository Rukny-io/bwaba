'use client';

import { Download, Loader2, X } from 'lucide-react';
import { Button, SearchField } from '@heroui/react';
import type { FormsListQuery } from '@/lib/types/forms';
import { FORM_STATUS_OPTIONS, FORM_VISIBILITY_OPTIONS } from '@/lib/forms-format';
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

interface FormsFiltersProps {
  search: string;
  query: FormsListQuery;
  isSearchPending?: boolean;
  isExporting?: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  onQueryChange: (patch: Partial<FormsListQuery>) => void;
  onExport: () => void;
}

export function FormsFilters({
  search,
  query,
  isSearchPending,
  isExporting,
  onSearchChange,
  onSearchCommit,
  onQueryChange,
  onExport,
}: FormsFiltersProps) {
  const hasActiveFilters = Boolean(
    query.search || query.status || query.visibility,
  );

  function handleClearAll() {
    onSearchChange('');
    onQueryChange({
      search: undefined,
      status: undefined,
      visibility: undefined,
      page: 1,
    });
  }

  return (
    <div className="space-y-3 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--surface)] sm:p-4 md:rounded-3xl">
      <div className="flex flex-col gap-3">
        <SearchField
          fullWidth
          aria-label="Search forms"
          name="forms-search"
          value={search}
          onChange={onSearchChange}
          onSubmit={onSearchCommit}
          className="min-w-0"
        >
          <SearchField.Group className="h-10 rounded-xl border-0 bg-[var(--surface-secondary)] sm:border sm:border-[var(--border)] sm:bg-[var(--field-background)]">
            <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
            <SearchField.Input
              placeholder="Search by title or slug…"
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

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <FilterDropdown
            label="Filter by visibility"
            value={query.visibility ?? ''}
            options={FORM_VISIBILITY_OPTIONS}
            className="w-full min-w-0"
            onChange={(visibility) =>
              onQueryChange({
                visibility: (visibility || undefined) as FormsListQuery['visibility'],
                page: 1,
              })
            }
          />

          <FilterDropdown
            label="Filter by status"
            value={query.status ?? ''}
            options={FORM_STATUS_OPTIONS}
            className="w-full min-w-0"
            onChange={(status) =>
              onQueryChange({
                status: (status || undefined) as FormsListQuery['status'],
                page: 1,
              })
            }
          />

          <Button
            variant="tertiary"
            size="sm"
            className="col-span-2 h-10 shrink-0 rounded-xl px-3 sm:col-span-1"
            isDisabled={isExporting}
            onPress={onExport}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export CSV
          </Button>
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
                FORM_STATUS_OPTIONS.find((o) => o.value === query.status)?.label ??
                'Status'
              }
              onRemove={() => onQueryChange({ status: undefined, page: 1 })}
            />
          ) : null}

          {query.visibility ? (
            <FilterChip
              label={
                FORM_VISIBILITY_OPTIONS.find((o) => o.value === query.visibility)
                  ?.label ?? 'Visibility'
              }
              onRemove={() => onQueryChange({ visibility: undefined, page: 1 })}
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
