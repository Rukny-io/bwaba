'use client';

import Link from 'next/link';
import type { AdminUser } from '@/lib/types/users';
import { UserAvatar } from '@/components/users/user-avatar';
import { displayUserName } from '@/lib/users-format';
import { cn } from '@/lib/utils';

interface UsersTableUserCellProps {
  user: AdminUser;
  className?: string;
}

export function UsersTableUserCell({ user, className }: UsersTableUserCellProps) {
  const name = displayUserName(user.name, user.email);

  return (
    <Link
      href={`/app/users/${user.id}`}
      className={cn('flex min-w-0 items-center gap-3 outline-none', className)}
    >
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <UserAvatar
          src={user.avatar}
          name={user.name}
          email={user.email}
          initialsClassName="text-[11px]"
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">{name}</p>
        <p className="truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
          {user.email}
        </p>
      </div>
    </Link>
  );
}
