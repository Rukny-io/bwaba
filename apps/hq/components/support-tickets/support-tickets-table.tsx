'use client';

import { EmptyState, Table } from '@heroui/react';
import type { SupportTicketSummary } from '@/lib/types/support-tickets';
import { SupportTicketsTableRow } from '@/components/support-tickets/support-tickets-table-row';
import { SupportTicketsMobileList } from '@/components/support-tickets/support-tickets-mobile-list';
import { ClientPagination } from '@/components/shared/client-pagination';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'ticket', label: 'Ticket', isRowHeader: true, className: 'w-[28%]' },
  { id: 'user', label: 'User', className: 'w-[22%]' },
  { id: 'status', label: 'Status', className: 'w-[12%]' },
  { id: 'category', label: 'Category', className: 'w-[12%]' },
  { id: 'priority', label: 'Priority', className: 'w-[10%]' },
  { id: 'updated', label: 'Updated', className: 'w-[16%]' },
] as const;

interface SupportTicketsTableProps {
  tickets: SupportTicketSummary[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function SupportTicketsTableHeader() {
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

function SupportTicketsTableLoadingBody() {
  return (
    <Table.Body>
      {Array.from({ length: 6 }).map((_, index) => (
        <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
          {COLUMNS.map((column) => (
            <Table.Cell key={column.id} className={column.className}>
              <div
                className={cn(
                  'animate-pulse rounded-md bg-[var(--surface-secondary)]',
                  column.id === 'ticket' || column.id === 'user' ? 'h-8' : 'h-4',
                )}
              />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function SupportTicketsTable({
  tickets,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: SupportTicketsTableProps) {
  return (
    <>
      <div className="sm:hidden">
        <SupportTicketsMobileList
          tickets={tickets}
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
          <Table.Content
            aria-label="Support tickets"
            className="w-full table-fixed"
          >
            <SupportTicketsTableHeader />

            {isLoading ? (
              <SupportTicketsTableLoadingBody />
            ) : (
              <Table.Body
                items={tickets}
                renderEmptyState={() => (
                  <EmptyState className="py-12">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      No tickets found
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Try a different status filter.
                    </p>
                  </EmptyState>
                )}
              >
                {(ticket) => (
                  <SupportTicketsTableRow key={ticket.id} ticket={ticket} />
                )}
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
