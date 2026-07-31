'use client';

import { useRouter } from 'next/navigation';
import { Button, Chip, Table, Tooltip } from '@heroui/react';
import type { SupportTicketSummary } from '@/lib/types/support-tickets';
import { SupportTicketsTableTicketCell } from '@/components/support-tickets/support-tickets-table-ticket-cell';
import { SupportTicketsTableUserCell } from '@/components/support-tickets/support-tickets-table-user-cell';
import { TableHint } from '@/components/shared/table-hint';
import {
  formatTicketCategory,
  formatTicketDate,
  formatTicketDateTime,
  formatTicketPriority,
  formatTicketStatus,
  ticketPriorityChipColor,
  ticketStatusChipColor,
  ticketPriorityHint,
  ticketStatusHint,
} from '@/lib/support-tickets-format';
import { cn } from '@/lib/utils';

interface SupportTicketsTableRowProps {
  ticket: SupportTicketSummary;
}

const cellTruncate = 'max-w-0 overflow-hidden';

export function SupportTicketsTableRow({ ticket }: SupportTicketsTableRowProps) {
  const router = useRouter();

  return (
    <Table.Row
      id={ticket.id}
      textValue={ticket.subject}
      className="group transition-colors hover:bg-[var(--surface-secondary)]/50"
    >
      <Table.Cell className={cn(cellTruncate, 'pe-2')}>
        <SupportTicketsTableTicketCell ticket={ticket} />
      </Table.Cell>

      <Table.Cell className={cn(cellTruncate, 'ps-2')}>
        <SupportTicketsTableUserCell ticket={ticket} />
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <TableHint content={ticketStatusHint(ticket.status)} ariaLabel="Ticket status">
          <Chip color={ticketStatusChipColor(ticket.status)} size="sm" variant="soft">
            {formatTicketStatus(ticket.status)}
          </Chip>
        </TableHint>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <span className="text-sm text-[var(--foreground)]">
          {formatTicketCategory(ticket.category)}
        </span>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <TableHint content={ticketPriorityHint(ticket.priority)} ariaLabel="Ticket priority">
          <Chip color={ticketPriorityChipColor(ticket.priority)} size="sm" variant="soft">
            {formatTicketPriority(ticket.priority)}
          </Chip>
        </TableHint>
      </Table.Cell>

      <Table.Cell className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <TableHint content={`Updated ${formatTicketDateTime(ticket.updatedAt)}`}>
            <time
              className="shrink-0 cursor-default text-xs text-[var(--muted-foreground)]"
              dateTime={ticket.updatedAt}
            >
              {formatTicketDate(ticket.updatedAt)}
            </time>
          </TableHint>
          <Tooltip delay={350}>
            <Button
              size="sm"
              variant="tertiary"
              className="h-7 shrink-0 rounded-lg px-2 opacity-80 transition-opacity group-hover:opacity-100"
              onPress={() => router.push(`/app/support-tickets/${ticket.id}`)}
            >
              Details
            </Button>
            <Tooltip.Content showArrow className="text-xs">
              <Tooltip.Arrow />
              Open ticket details in HQ
            </Tooltip.Content>
          </Tooltip>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
