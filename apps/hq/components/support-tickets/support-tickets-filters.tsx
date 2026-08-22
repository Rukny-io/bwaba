'use client';

import { Loader2, X } from 'lucide-react';
import { Button, SearchField } from '@heroui/react';
import type { SupportTicketsListQuery } from '@/lib/types/support-tickets';
import {
  SUPPORT_TICKET_ASSIGNMENT_OPTIONS,
  SUPPORT_TICKET_CATEGORY_FILTER_OPTIONS,
  SUPPORT_TICKET_PRIORITY_FILTER_OPTIONS,
  SUPPORT_TICKET_STATUS_OPTIONS,
} from '@/lib/support-tickets-query';
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

interface SupportTicketsFiltersProps {
  query: SupportTicketsListQuery;
  adminOptions?: { value: string; label: string }[];
  search: string;
  isSearchPending?: boolean;
  onSearchChange: (value: string) => void;
  onSearchCommit?: () => void;
  onQueryChange: (patch: Partial<SupportTicketsListQuery>) => void;
}

export function SupportTicketsFilters({
  query,
  adminOptions = [],
  search,
  isSearchPending,
  onSearchChange,
  onSearchCommit,
  onQueryChange,
}: SupportTicketsFiltersProps) {
  const assignmentOptions = [
    ...SUPPORT_TICKET_ASSIGNMENT_OPTIONS,
    ...adminOptions,
  ];

  const hasActiveFilters = Boolean(
    query.status ||
      query.category ||
      query.priority ||
      query.search ||
      query.assignedTo,
  );

  function handleClearAll() {
    onSearchChange('');
    onQueryChange({
      search: undefined,
      status: undefined,
      category: undefined,
      priority: undefined,
      assignedTo: undefined,
      page: 1,
    });
  }

  return (
    <div className="space-y-3 sm:dashboard-card sm:rounded-2xl sm:p-4 md:rounded-3xl">
      <div className="flex flex-col gap-3">
        <SearchField
          fullWidth
          aria-label="Search tickets"
          name="support-tickets-search"
          value={search}
          onChange={onSearchChange}
          onSubmit={onSearchCommit}
          className="min-w-0"
        >
          <SearchField.Group className="h-10 rounded-xl border-0 bg-[var(--surface-secondary)]">
            <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
            <SearchField.Input
              placeholder="Search subject, number, or email…"
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

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterDropdown
            label="Filter by status"
            value={query.status ?? ''}
            options={SUPPORT_TICKET_STATUS_OPTIONS}
            className="w-full min-w-0"
            onChange={(status) =>
              onQueryChange({
                status: (status || undefined) as SupportTicketsListQuery['status'],
                page: 1,
              })
            }
          />
          <FilterDropdown
            label="Filter by category"
            value={query.category ?? ''}
            options={SUPPORT_TICKET_CATEGORY_FILTER_OPTIONS}
            className="w-full min-w-0"
            onChange={(category) =>
              onQueryChange({
                category: (category || undefined) as SupportTicketsListQuery['category'],
                page: 1,
              })
            }
          />
          <FilterDropdown
            label="Filter by priority"
            value={query.priority ?? ''}
            options={SUPPORT_TICKET_PRIORITY_FILTER_OPTIONS}
            className="w-full min-w-0"
            onChange={(priority) =>
              onQueryChange({
                priority: (priority || undefined) as SupportTicketsListQuery['priority'],
                page: 1,
              })
            }
          />
          <FilterDropdown
            label="Filter by assignment"
            value={query.assignedTo ?? ''}
            options={assignmentOptions}
            className="w-full min-w-0"
            onChange={(assignedTo) =>
              onQueryChange({
                assignedTo: assignedTo || undefined,
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
                SUPPORT_TICKET_STATUS_OPTIONS.find((o) => o.value === query.status)
                  ?.label ?? 'Status'
              }
              onRemove={() => onQueryChange({ status: undefined, page: 1 })}
            />
          ) : null}

          {query.category ? (
            <FilterChip
              label={
                SUPPORT_TICKET_CATEGORY_FILTER_OPTIONS.find(
                  (o) => o.value === query.category,
                )?.label ?? 'Category'
              }
              onRemove={() => onQueryChange({ category: undefined, page: 1 })}
            />
          ) : null}

          {query.priority ? (
            <FilterChip
              label={
                SUPPORT_TICKET_PRIORITY_FILTER_OPTIONS.find(
                  (o) => o.value === query.priority,
                )?.label ?? 'Priority'
              }
              onRemove={() => onQueryChange({ priority: undefined, page: 1 })}
            />
          ) : null}

          {query.assignedTo ? (
            <FilterChip
              label={
                assignmentOptions.find((o) => o.value === query.assignedTo)?.label ??
                'Assignment'
              }
              onRemove={() => onQueryChange({ assignedTo: undefined, page: 1 })}
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
