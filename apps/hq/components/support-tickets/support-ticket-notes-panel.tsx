'use client';

import { Button } from '@heroui/react';
import type { SupportTicketMessage } from '@/lib/types/support-tickets';
import { formatTicketDateTime } from '@/lib/support-tickets-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

interface SupportTicketNotesPanelProps {
  messages: SupportTicketMessage[];
  internalNote: string;
  busy: boolean;
  onInternalNoteChange: (value: string) => void;
  onAddNote: () => void;
}

export function SupportTicketNotesPanel({
  messages,
  internalNote,
  busy,
  onInternalNoteChange,
  onAddNote,
}: SupportTicketNotesPanelProps) {
  return (
    <section className={detailPanelClassName}>
      <h2 className="text-sm font-semibold text-[var(--foreground)]">Internal notes</h2>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Visible to HQ staff only. Customers will not see these notes.
      </p>

      <div className="mt-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No internal notes yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--foreground)]">Staff note</p>
                <time
                  className="text-[11px] text-[var(--muted-foreground)]"
                  dateTime={message.createdAt}
                >
                  {formatTicketDateTime(message.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm text-[var(--foreground)]">
                {message.body}
              </p>
            </div>
          ))
        )}
      </div>

      <textarea
        value={internalNote}
        onChange={(e) => onInternalNoteChange(e.target.value)}
        maxLength={5000}
        rows={3}
        placeholder="Add an internal note for the team…"
        className="mt-4 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
      />
      <Button
        variant="tertiary"
        className="mt-3 rounded-xl"
        isDisabled={busy || !internalNote.trim()}
        onPress={onAddNote}
      >
        {busy ? 'Saving…' : 'Add internal note'}
      </Button>
    </section>
  );
}
