'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { AdminUser } from '@/lib/types/users';
import { UsersTableUserCell } from '@/components/users/users-table-user-cell';
import { UsersRowActions } from '@/components/users/users-row-actions';
import {
  accountStatusChipColor,
  formatLastSeen,
  formatRole,
  roleChipColor,
} from '@/lib/users-format';
import { ClientPagination } from '@/components/shared/client-pagination';
import { cn } from '@/lib/utils';

interface UsersMobileListProps {
  users: AdminUser[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function UsersMobileSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          key={`users-mobile-loading-${index}`}
          className="h-[7.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
        />
      ))}
    </ul>
  );
}

export function UsersMobileList({
  users,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onRefresh,
}: UsersMobileListProps) {
  if (isLoading) {
    return <UsersMobileSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No users found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search term or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id}>
            <div
              className={cn(
                'rounded-2xl bg-[var(--surface-secondary)]/55 p-3',
                user.isDeactivated && 'opacity-80',
              )}
            >
              <UsersTableUserCell user={user} />

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
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {formatLastSeen(user.lastLoginAt)}
                </span>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/app/users/${user.id}`}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--primary)]"
                  >
                    Details
                  </Link>
                  <UsersRowActions user={user} onRefresh={onRefresh} />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-[var(--surface-secondary)]/40 px-2 py-2">
        <ClientPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
