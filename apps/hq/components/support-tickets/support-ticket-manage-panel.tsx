'use client';

import { Button } from '@heroui/react';
import type {
  AdminSupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/lib/types/support-tickets';
import { SUPPORT_TICKET_PRIORITY_OPTIONS } from '@/lib/support-tickets-format';
import { SUPPORT_TICKET_STATUS_OPTIONS } from '@/lib/support-tickets-query';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';

interface SupportTicketManagePanelProps {
  ticket: AdminSupportTicketDetail;
  statusDraft: SupportTicketStatus;
  priorityDraft: SupportTicketPriority;
  assignDraft: string;
  assignOptions: { value: string; label: string }[];
  busy: boolean;
  onStatusChange: (value: SupportTicketStatus) => void;
  onPriorityChange: (value: SupportTicketPriority) => void;
  onAssignChange: (value: string) => void;
  onSave: () => void;
}

export function SupportTicketManagePanel({
  ticket,
  statusDraft,
  priorityDraft,
  assignDraft,
  assignOptions,
  busy,
  onStatusChange,
  onPriorityChange,
  onAssignChange,
  onSave,
}: SupportTicketManagePanelProps) {
  const hasChanges =
    statusDraft !== ticket.status ||
    priorityDraft !== ticket.priority ||
    assignDraft !== (ticket.assignedTo ?? '');

  return (
    <section className={detailPanelClassName}>
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Update ticket</h2>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Change status, priority, or assignment for this ticket.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Status</p>
          <FilterDropdown
            label="Ticket status"
            value={statusDraft}
            options={SUPPORT_TICKET_STATUS_OPTIONS.filter((o) => o.value)}
            onChange={(value) => onStatusChange(value as SupportTicketStatus)}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Priority</p>
          <FilterDropdown
            label="Ticket priority"
            value={priorityDraft}
            options={SUPPORT_TICKET_PRIORITY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(value) => onPriorityChange(value as SupportTicketPriority)}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Assigned to</p>
          <FilterDropdown
            label="Assign ticket"
            value={assignDraft}
            options={assignOptions}
            onChange={onAssignChange}
          />
        </div>
        <Button
          variant="tertiary"
          className="h-10 rounded-xl"
          isDisabled={busy || !hasChanges}
          onPress={onSave}
        >
          Save changes
        </Button>
      </div>
    </section>
  );
}
