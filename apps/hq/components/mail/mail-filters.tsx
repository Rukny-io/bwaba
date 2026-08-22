'use client';

import { Download, Loader2, X } from 'lucide-react';
import { SearchField } from '@heroui/react';
import type { MailAppsListQuery } from '@/lib/types/mail';
import {
  MAIL_DOMAIN_STATUS_OPTIONS,
  MAIL_PLAN_OPTIONS,
  MAIL_STATUS_OPTIONS,
} from '@/lib/mail-format';
import { FilterDropdown } from '@/components/shared/filter-dropdown';

interface MailFiltersProps {
  search: string;
  query: MailAppsListQuery;
  isExporting?: boolean;
  isSearchPending?: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  onQueryChange: (patch: Partial<MailAppsListQuery>) => void;
  onExport: () => void;
}

export function MailFilters({
  search,
  query,
  isExporting,
  isSearchPending,
  onSearchChange,
  onSearchCommit,
  onQueryChange,
  onExport,
}: MailFiltersProps) {
  const hasActiveFilters = Boolean(
    query.search || query.status || query.plan || query.domainStatus,
  );

  function handleClearAll() {
    onSearchChange('');
    onQueryChange({
      search: undefined,
      status: undefined,
      plan: undefined,
      domainStatus: undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField
        fullWidth
        aria-label="Search apps"
        name="mail-search"
        value={search}
        onChange={onSearchChange}
        onSubmit={onSearchCommit}
        className="min-w-0 sm:max-w-sm"
      >
        <SearchField.Group className="h-8 rounded-lg border-0 bg-[var(--surface-secondary)]">
          <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
          <SearchField.Input
            placeholder="Name, app ID, domain, owner…"
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
          label="App status"
          value={query.status ?? ''}
          options={MAIL_STATUS_OPTIONS.map((option) =>
            option.value === '' ? { ...option, label: 'Status' } : option,
          )}
          onChange={(status) =>
            onQueryChange({
              status: (status || undefined) as MailAppsListQuery['status'],
              page: 1,
            })
          }
        />
        <FilterDropdown
          size="sm"
          label="Plan"
          value={query.plan ?? ''}
          options={MAIL_PLAN_OPTIONS.map((option) =>
            option.value === '' ? { ...option, label: 'Plan' } : option,
          )}
          onChange={(plan) =>
            onQueryChange({
              plan: (plan || undefined) as MailAppsListQuery['plan'],
              page: 1,
            })
          }
        />
        <FilterDropdown
          size="sm"
          label="Domain status"
          value={query.domainStatus ?? ''}
          options={MAIL_DOMAIN_STATUS_OPTIONS.map((option) =>
            option.value === '' ? { ...option, label: 'Domain' } : option,
          )}
          onChange={(domainStatus) =>
            onQueryChange({
              domainStatus: (domainStatus ||
                undefined) as MailAppsListQuery['domainStatus'],
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
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            <X className="size-3.5" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
