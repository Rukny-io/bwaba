'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { AdminUser } from '@/lib/types/users';
import { UserAvatar } from '@/components/users/user-avatar';
import { UserVerificationBadge } from '@/components/users/user-verification-badge';
import { UsersRowActions } from '@/components/users/users-row-actions';
import {
  accountStatusChipColor,
  displayUserName,
  formatLastSeen,
  formatRole,
  roleChipColor,
} from '@/lib/users-format';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: AdminUser;
  onRefresh: () => void;
}

export function UserCard({ user, onRefresh }: UserCardProps) {
  const name = displayUserName(user.name, user.email);
  const detailHref = `/app/users/${user.id}`;

  return (
    <article
      className={cn(
        'dashboard-card flex h-full flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5',
        user.isDeactivated && 'opacity-80',
      )}
    >
      <div className="flex items-start gap-3">
        <Link
          href={detailHref}
          className="flex min-w-0 flex-1 items-center gap-3 outline-none"
        >
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]/40">
            <UserAvatar
              src={user.avatar}
              name={user.name}
              email={user.email}
              initialsClassName="text-xs"
            />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-[var(--foreground)]">
              <span className="truncate">{name}</span>
              <UserVerificationBadge
                isRuknyVerified={user.isRuknyVerified}
                verificationLevel={user.verificationLevel}
              />
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
              {user.email}
            </p>
            {user.username ? (
              <p className="truncate text-[11px] text-[var(--muted-foreground)]/80" dir="ltr">
                @{user.username}
              </p>
            ) : null}
          </div>
        </Link>
        <UsersRowActions user={user} onRefresh={onRefresh} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip color={roleChipColor(user.role)} size="sm" variant="soft">
          {formatRole(user.role)}
        </Chip>
        <Chip size="sm" variant="soft">
          {user.subscriptionPlan || 'FREE'}
        </Chip>
        <Chip
          color={accountStatusChipColor(user.isDeactivated)}
          size="sm"
          variant="soft"
        >
          {user.isDeactivated ? 'Deactivated' : 'Active'}
        </Chip>
        {user.twoFactorEnabled ? (
          <Chip size="sm" variant="soft" color="accent">
            2FA
          </Chip>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)]/50 pt-3">
        <span className="text-[11px] text-[var(--muted-foreground)]">
          {formatLastSeen(user.lastLoginAt)}
        </span>
        <Link
          href={detailHref}
          className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
        >
          Details
        </Link>
      </div>
    </article>
  );
}
