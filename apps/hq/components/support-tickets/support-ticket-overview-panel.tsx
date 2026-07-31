'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@heroui/react';
import type { AdminSupportTicketDetail } from '@/lib/types/support-tickets';
import {
  formatTicketCategory,
  formatTicketDateTime,
  formatTicketPriority,
  formatTicketStatus,
} from '@/lib/support-tickets-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span
        className="max-w-[65%] text-end text-xs font-medium text-[var(--foreground)]"
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

interface SupportTicketOverviewPanelProps {
  ticket: AdminSupportTicketDetail;
  currentAdminId: string;
  canStartWork: boolean;
  busy: boolean;
  onStartWork: () => void;
}

export function SupportTicketOverviewPanel({
  ticket,
  currentAdminId,
  canStartWork,
  busy,
  onStartWork,
}: SupportTicketOverviewPanelProps) {
  const isAssignedToMe = ticket.assignedTo === currentAdminId;

  return (
    <div className="space-y-4">
      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Ticket description
        </h2>
        <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
          {ticket.description}
        </p>
      </section>

      {ticket.context && Object.keys(ticket.context).length > 0 ? (
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            Context
          </h2>
          <pre className="overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 text-xs text-[var(--foreground)]">
            {JSON.stringify(ticket.context, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Details</h2>
        <DetailRow label="Ticket number" value={ticket.number} />
        <DetailRow label="Status" value={formatTicketStatus(ticket.status)} />
        <DetailRow label="Priority" value={formatTicketPriority(ticket.priority)} />
        <DetailRow label="Category" value={formatTicketCategory(ticket.category)} />
        <DetailRow label="Opened" value={formatTicketDateTime(ticket.createdAt)} />
        <DetailRow label="Last updated" value={formatTicketDateTime(ticket.updatedAt)} />
        <DetailRow
          label="Customer"
          value={ticket.userEmail}
        />
        <DetailRow
          label="Assigned"
          value={
            ticket.assignedTo
              ? isAssignedToMe
                ? 'You'
                : 'Staff member'
              : 'Unassigned'
          }
        />
        {ticket.messageCount != null ? (
          <DetailRow label="Messages" value={String(ticket.messageCount)} />
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        {canStartWork ? (
          <Button
            size="sm"
            className="rounded-xl"
            isDisabled={busy}
            onPress={onStartWork}
          >
            <Play className="size-4" />
            Start work
          </Button>
        ) : null}
        <Link
          href={`/app/users/${ticket.userId}`}
          className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-tertiary)]"
        >
          View customer
        </Link>
      </div>
    </div>
  );
}
