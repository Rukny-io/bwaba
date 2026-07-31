'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import type {
  AdminSupportTicketDetail,
  SupportTicketMessage,
} from '@/lib/types/support-tickets';
import { UserAvatar } from '@/components/users/user-avatar';
import { formatTicketDateTime } from '@/lib/support-tickets-format';
import { SupportAttachmentsList } from '@/components/support-tickets/support-attachments-list';
import { SupportCannedRepliesPicker } from '@/components/support-tickets/support-canned-replies-picker';
import { useSupportTicketTyping } from '@/hooks/use-support-ticket-typing';
import { cn } from '@/lib/utils';

function StaffAvatar() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/10">
      <Image
        src="/rukny-logo.svg"
        alt="Rukny Support"
        width={22}
        height={22}
        className="size-[22px] object-contain"
      />
    </div>
  );
}

function ChatBubble({
  message,
  ticket,
}: {
  message: SupportTicketMessage;
  ticket: AdminSupportTicketDetail;
}) {
  const isStaff = message.isStaff;

  return (
    <div
      className={cn(
        'flex w-full max-w-[92%] gap-2.5',
        isStaff ? 'me-auto flex-row' : 'ms-auto flex-row-reverse',
      )}
    >
      {isStaff ? (
        <StaffAvatar />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
          <UserAvatar
            email={ticket.userEmail}
            name={ticket.userEmail.split('@')[0]}
            initialsClassName="text-[10px]"
          />
        </div>
      )}

      <div
        className={cn(
          'flex min-w-0 max-w-[min(100%,28rem)] flex-col gap-1',
          isStaff ? 'items-start' : 'items-end',
        )}
      >
        <div
          className={cn(
            'flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]',
            isStaff ? 'flex-row' : 'flex-row-reverse',
          )}
        >
          <span className="font-medium text-[var(--foreground)]">
            {isStaff ? 'Support team' : 'Customer'}
          </span>
          <time className="text-[var(--muted-foreground)]" dateTime={message.createdAt}>
            {formatTicketDateTime(message.createdAt)}
          </time>
        </div>

        <div
          className={cn(
            'w-full rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isStaff
              ? 'rounded-es-md bg-[var(--primary)]/8 text-[var(--foreground)]'
              : 'rounded-ee-md bg-[var(--surface)] text-[var(--foreground)] shadow-sm shadow-black/[0.03]',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
          {message.attachments?.length ? (
            <SupportAttachmentsList attachments={message.attachments} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface SupportTicketConversationPanelProps {
  ticket: AdminSupportTicketDetail;
  isLive: boolean;
  reply: string;
  busy: boolean;
  canReply: boolean;
  onReplyChange: (value: string) => void;
  onSendReply: () => void;
}

export function SupportTicketConversationPanel({
  ticket,
  isLive,
  reply,
  busy,
  canReply,
  onReplyChange,
  onSendReply,
}: SupportTicketConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const publicMessages = ticket.messages.filter((message) => !message.isInternal);
  const { peerTyping } = useSupportTicketTyping(ticket.id, reply, {
    enabled: canReply,
    viewerIsStaff: true,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [publicMessages.length, publicMessages[publicMessages.length - 1]?.id, peerTyping]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-[var(--surface-secondary)]/40 sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Conversation</h2>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        ) : (
          <span className="text-[11px] text-[var(--muted-foreground)]">Connecting…</span>
        )}
      </div>

      <div className="flex max-h-[min(58vh,520px)] flex-col gap-4 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {publicMessages.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            No messages yet. Send the first reply below.
          </p>
        ) : (
          publicMessages.map((message) => (
            <ChatBubble key={message.id} message={message} ticket={ticket} />
          ))
        )}

        {peerTyping ? (
          <div className="ms-auto flex max-w-[92%] items-center justify-end px-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--muted-foreground)] shadow-sm shadow-black/[0.03]">
              <span className="flex gap-0.5">
                <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]/70 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]/70 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]/70 [animation-delay:300ms]" />
              </span>
              Customer is typing…
            </span>
          </div>
        ) : null}

        {ticket.attachments?.length ? (
          <div className="rounded-2xl bg-[var(--surface)]/70 px-3.5 py-3 shadow-sm shadow-black/[0.03]">
            <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
              Ticket attachments
            </p>
            <SupportAttachmentsList attachments={ticket.attachments} />
          </div>
        ) : null}

        <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
      </div>

      {canReply ? (
        <div className="mx-3 mb-3 rounded-2xl bg-[var(--surface)] p-3 shadow-sm shadow-black/[0.04] sm:mx-4 sm:mb-4 sm:p-4">
          <textarea
            value={reply}
            onChange={(e) => onReplyChange(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="Write a reply to the customer…"
            className="w-full resize-none rounded-xl bg-[var(--surface-secondary)]/60 px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-0 placeholder:text-[var(--muted-foreground)] focus:bg-[var(--surface-secondary)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSendReply();
              }
            }}
          />

          <div className="mt-3 flex items-center justify-end gap-2">
            <SupportCannedRepliesPicker
              disabled={busy}
              onSelect={(body) => {
                onReplyChange(reply.trim() ? `${reply.trim()}\n\n${body}` : body);
              }}
            />
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity disabled:opacity-50"
              disabled={busy || !reply.trim()}
              onClick={onSendReply}
            >
              {busy ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
