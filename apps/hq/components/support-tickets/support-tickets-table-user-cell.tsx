'use client';

import Link from 'next/link';
import type { SupportTicketSummary } from '@/lib/types/support-tickets';
import { UserAvatar } from '@/components/users/user-avatar';
import { cn } from '@/lib/utils';

export function SupportTicketsTableUserCell({
  ticket,
  className,
}: {
  ticket: SupportTicketSummary;
  className?: string;
}) {
  if (!ticket.userId || !ticket.userEmail) {
    return <span className="text-sm text-[var(--muted-foreground)]">—</span>;
  }

  const displayName = ticket.userEmail.split('@')[0] ?? ticket.userEmail;

  return (
    <Link
      href={`/app/users/${ticket.userId}`}
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-lg outline-none transition-colors hover:text-[var(--primary)]',
        className,
      )}
      title={ticket.userEmail}
    >
      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <UserAvatar
          email={ticket.userEmail}
          name={displayName}
          initialsClassName="text-[10px]"
        />
      </div>
      <div className="min-w-0">
        <span className="block truncate text-sm font-medium leading-snug text-[var(--foreground)]">
          {displayName}
        </span>
        <span
          className="block truncate text-xs leading-snug text-[var(--muted-foreground)]"
          dir="ltr"
        >
          {ticket.userEmail}
        </span>
      </div>
    </Link>
  );
}
