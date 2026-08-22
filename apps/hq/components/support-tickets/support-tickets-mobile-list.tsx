'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { SupportTicketSummary } from '@/lib/types/support-tickets';
import { SupportTicketsTableTicketCell } from '@/components/support-tickets/support-tickets-table-ticket-cell';
import { SupportTicketsTableUserCell } from '@/components/support-tickets/support-tickets-table-user-cell';
import { ClientPagination } from '@/components/shared/client-pagination';
import {
  formatTicketCategory,
  formatTicketDate,
  formatTicketPriority,
  formatTicketStatus,
  ticketPriorityChipColor,
  ticketStatusChipColor,
} from '@/lib/support-tickets-format';

interface SupportTicketsMobileListProps {
  tickets: SupportTicketSummary[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function SupportTicketsMobileSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          key={`mobile-loading-${index}`}
          className="h-[7.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
        />
      ))}
    </ul>
  );
}

export function SupportTicketsMobileList({
  tickets,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: SupportTicketsMobileListProps) {
  if (isLoading) {
    return <SupportTicketsMobileSkeleton />;
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No tickets found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <div className="rounded-2xl bg-[var(--surface-secondary)]/55 p-3">
              <Link href={`/app/support-tickets/${ticket.id}`} className="block">
                <SupportTicketsTableTicketCell ticket={ticket} linkToDetail={false} />
              </Link>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip color={ticketStatusChipColor(ticket.status)} size="sm" variant="soft">
                  {formatTicketStatus(ticket.status)}
                </Chip>
                <Chip size="sm" variant="soft">
                  {formatTicketCategory(ticket.category)}
                </Chip>
                <Chip color={ticketPriorityChipColor(ticket.priority)} size="sm" variant="soft">
                  {formatTicketPriority(ticket.priority)}
                </Chip>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <SupportTicketsTableUserCell ticket={ticket} className="min-w-0 flex-1" />
                <time
                  className="shrink-0 text-[11px] text-[var(--muted-foreground)]"
                  dateTime={ticket.updatedAt}
                >
                  {formatTicketDate(ticket.updatedAt)}
                </time>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-[var(--surface-secondary)]/40 px-2 py-2">
        <ClientPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
