'use client';

import { EmptyState, Table } from '@heroui/react';
import type { AdminStore } from '@/lib/types/stores';
import { StoresTableRow } from '@/components/stores/stores-table-row';
import { StoresMobileList } from '@/components/stores/stores-mobile-list';
import { ClientPagination } from '@/components/shared/client-pagination';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'store', label: 'Store', isRowHeader: true, className: 'w-[18%]' },
  { id: 'owner', label: 'Owner', className: 'w-[18%]' },
  { id: 'category', label: 'Category', className: 'w-[10%]' },
  { id: 'city', label: 'City', className: 'w-[8%]' },
  { id: 'status', label: 'Status', className: 'w-[8%]' },
  { id: 'products', label: 'Products', className: 'w-[8%] text-end' },
  { id: 'orders', label: 'Orders', className: 'w-[8%] text-end' },
  { id: 'created', label: 'Created', className: 'w-[22%]' },
] as const;

interface StoresTableProps {
  stores: AdminStore[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function StoresTableHeader() {
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

function StoresTableLoadingBody() {
  return (
    <Table.Body>
      {Array.from({ length: 6 }).map((_, index) => (
        <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
          {COLUMNS.map((column) => (
            <Table.Cell key={column.id} className={column.className}>
              <div
                className={cn(
                  'animate-pulse rounded-md bg-[var(--surface-secondary)]',
                  column.id === 'store' || column.id === 'owner' ? 'h-8' : 'h-4',
                )}
              />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function StoresTable({
  stores,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: StoresTableProps) {
  return (
    <>
      <div className="sm:hidden">
        <StoresMobileList
          stores={stores}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>

      <div className="dashboard-card hidden overflow-hidden rounded-2xl sm:block sm:rounded-3xl">
        <Table className="p-4">
          <Table.ScrollContainer>
            <Table.Content aria-label="Platform stores" className="w-full table-fixed">
              <StoresTableHeader />

              {isLoading ? (
                <StoresTableLoadingBody />
              ) : (
                <Table.Body
                  items={stores}
                  renderEmptyState={() => (
                    <EmptyState className="py-12">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        No stores found
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Try a different search term or filter.
                      </p>
                    </EmptyState>
                  )}
                >
                  {(store) => <StoresTableRow store={store} />}
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
    </>
  );
}
