'use client';

import { Download, Loader2, X } from 'lucide-react';
import { Button, SearchField } from '@heroui/react';
import type { UsersListQuery } from '@/lib/types/users';
import { ROLE_OPTIONS, VERIFIED_FILTER_OPTIONS } from '@/lib/users-format';
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
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:rounded-3xl sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField
          fullWidth
          aria-label="Search users"
          name="users-search"
          value={search}
          onChange={onSearchChange}
          onSubmit={onSearchCommit}
          className="min-w-0 flex-1"
        >
          <SearchField.Group className="h-10 rounded-xl border border-[var(--border)] bg-[var(--field-background)]">
            <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
            <SearchField.Input
              placeholder="Search by email, name, or username…"
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

        <div className="flex flex-wrap items-center gap-2">
          <FilterDropdown
            label="Filter by role"
            value={query.role ?? ''}
            options={ROLE_OPTIONS}
            onChange={(role) =>
              onQueryChange({
                role: (role || undefined) as UsersListQuery['role'],
                page: 1,
              })
            }
          />

          <FilterDropdown
            label="Filter by verification"
            value={query.emailVerified ?? ''}
            options={VERIFIED_FILTER_OPTIONS}
            onChange={(emailVerified) =>
              onQueryChange({
                emailVerified: (emailVerified ||
                  undefined) as UsersListQuery['emailVerified'],
                page: 1,
              })
            }
          />

          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-xl"
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
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/60 pt-3">
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

          {query.role ? (
            <FilterChip
              label={`Role: ${ROLE_OPTIONS.find((o) => o.value === query.role)?.label}`}
              onRemove={() => onQueryChange({ role: undefined, page: 1 })}
            />
          ) : null}

          {query.emailVerified ? (
            <FilterChip
              label={
                VERIFIED_FILTER_OPTIONS.find((o) => o.value === query.emailVerified)
                  ?.label ?? 'Verification'
              }
              onRemove={() => onQueryChange({ emailVerified: undefined, page: 1 })}
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
