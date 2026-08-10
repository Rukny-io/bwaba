'use client';

import Link from 'next/link';
import type { AdminStoreOwner } from '@/lib/types/stores';
import { UserAvatar } from '@/components/users/user-avatar';
import {
  formatStoreOwnerPrimary,
  formatStoreOwnerSecondary,
} from '@/lib/stores-format';
import { cn } from '@/lib/utils';

interface StoresTableOwnerCellProps {
  owner: AdminStoreOwner;
  className?: string;
}

export function StoresTableOwnerCell({ owner, className }: StoresTableOwnerCellProps) {
  const primary = formatStoreOwnerPrimary(owner);
  const secondary = formatStoreOwnerSecondary(owner);

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Link
        href={`/app/users/${owner.id}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg outline-none transition-colors hover:text-[var(--primary)]"
        title={`${primary} · ${owner.email}`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <UserAvatar
            src={owner.profile?.avatar}
            name={owner.profile?.name}
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
    </div>
  );
}
