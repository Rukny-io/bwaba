'use client';

import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import type { SupportTicketSummary } from '@/lib/types/support-tickets';
import { TableHint } from '@/components/shared/table-hint';
import { cn } from '@/lib/utils';

export function SupportTicketsTableTicketCell({
  ticket,
  className,
  linkToDetail = true,
}: {
  ticket: SupportTicketSummary;
  className?: string;
  linkToDetail?: boolean;
}) {
  const title = linkToDetail ? (
    <Link
      href={`/app/support-tickets/${ticket.id}`}
      className="block truncate text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
      title={`Open details for ${ticket.subject}`}
    >
      {ticket.subject}
    </Link>
  ) : (
    <p className="truncate text-sm font-medium leading-snug text-[var(--foreground)]">
      {ticket.subject}
    </p>
  );

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        <LifeBuoy className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        {title}
        <TableHint
          content={`Ticket: ${ticket.number}\nCategory: ${ticket.category}`}
          ariaLabel="Ticket number and category"
        >
          <p
            className="truncate font-mono text-[11px] leading-snug text-[var(--muted-foreground)]"
            dir="ltr"
          >
            {ticket.number}
          </p>
        </TableHint>
      </div>
    </div>
  );
}
