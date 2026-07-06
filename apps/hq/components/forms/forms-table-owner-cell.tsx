'use client';

import Link from 'next/link';
import type { AdminFormOwner } from '@/lib/types/forms';
import { UserAvatar } from '@/components/users/user-avatar';
import { UserVerificationBadge } from '@/components/users/user-verification-badge';
import { formatOwnerPrimary, formatOwnerSecondary } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

interface FormsTableOwnerCellProps {
  owner: AdminFormOwner;
  className?: string;
}

export function FormsTableOwnerCell({ owner, className }: FormsTableOwnerCellProps) {
  const primary = formatOwnerPrimary(owner);
  const secondary = formatOwnerSecondary(owner);
  const hasBadge = owner.isRuknyVerified || owner.verificationLevel >= 3;

  return (
    <div className={cn('flex min-w-0 items-center gap-1', className)}>
      <Link
        href={`/app/users/${owner.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none transition-colors hover:text-[var(--primary)]"
        title={`${primary} · ${owner.email}`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <UserAvatar
            src={owner.avatar}
            name={owner.name}
            email={owner.email}
            initialsClassName="text-[10px]"
          />
        </div>
        <div className="min-w-0">
          <span className="block truncate text-sm font-medium leading-snug text-[var(--foreground)]">
            {primary}
          </span>
          {secondary ? (
            <span
              className="block truncate text-xs leading-snug text-[var(--muted-foreground)]"
              dir="ltr"
            >
              {secondary}
            </span>
          ) : null}
        </div>
      </Link>
      {hasBadge ? (
        <UserVerificationBadge
          isRuknyVerified={owner.isRuknyVerified}
          verificationLevel={owner.verificationLevel}
        />
      ) : null}
    </div>
  );
}
