'use client';

import { EmptyState, Table } from '@heroui/react';
import type { AdminForm } from '@/lib/types/forms';
import { FormsTableRow } from '@/components/forms/forms-table-row';
import { ClientPagination } from '@/components/shared/client-pagination';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'form', label: 'Form', isRowHeader: true, className: 'w-[22%]' },
  { id: 'owner', label: 'Owner', className: 'w-[24%]' },
  { id: 'status', label: 'Status', className: 'w-[9%]' },
  { id: 'submissions', label: 'Subs', className: 'w-[9%] text-end' },
  { id: 'views', label: 'Views', className: 'w-[8%] text-end' },
  { id: 'created', label: 'Created', className: 'w-[32%]' },
] as const;

interface FormsTableProps {
  forms: AdminForm[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function FormsTableHeader() {
  return (
    <Table.Header>
      {COLUMNS.map((column) => (
        <Table.Column
          key={column.id}
          id={column.id}
          isRowHeader={'isRowHeader' in column ? column.isRowHeader : false}
          className={cn(
            column.className,
            'text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]',
          )}
        >
          {column.label}
        </Table.Column>
      ))}
    </Table.Header>
  );
}

function FormsTableLoadingBody() {
  return (
    <Table.Body>
      {Array.from({ length: 6 }).map((_, index) => (
        <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
          {COLUMNS.map((column) => (
            <Table.Cell key={column.id} className={column.className}>
              <div
                className={cn(
                  'animate-pulse rounded-md bg-[var(--surface-secondary)]',
                  column.id === 'form' || column.id === 'owner' ? 'h-8' : 'h-4',
                )}
              />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function FormsTable({
  forms,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: FormsTableProps) {
  return (
    <div className="dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl">
      <Table className="p-4">
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Platform forms"
            className="w-full table-fixed"
          >
            <FormsTableHeader />

            {isLoading ? (
              <FormsTableLoadingBody />
            ) : (
              <Table.Body
                items={forms}
                renderEmptyState={() => (
                  <EmptyState className="py-12">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      No forms found
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Try a different search term or filter.
                    </p>
                  </EmptyState>
                )}
              >
                {(form) => <FormsTableRow form={form} />}
              </Table.Body>
            )}
          </Table.Content>
        </Table.ScrollContainer>

        {!isLoading ? (
          <Table.Footer className="border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/30 px-1">
            <ClientPagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={onPageChange}
            />
          </Table.Footer>
        ) : null}
      </Table>
    </div>
  );
}
