'use client';

import type { AdminUser } from '@/lib/types/users';
import { UserCard } from '@/components/users/user-card';
import { ClientPagination } from '@/components/shared/client-pagination';

interface UsersCardsGridProps {
  users: AdminUser[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function UsersCardsSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={`users-card-loading-${index}`}
          className="h-[17.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:rounded-3xl"
        />
      ))}
    </ul>
  );
}

export function UsersCardsGrid({
  users,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onRefresh,
}: UsersCardsGridProps) {
  if (isLoading) {
    return <UsersCardsSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="dashboard-card rounded-2xl px-6 py-16 text-center sm:rounded-3xl">
        <p className="text-sm font-medium text-[var(--foreground)]">No users found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search term or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <li key={user.id} className="min-h-0">
            <UserCard user={user} onRefresh={onRefresh} />
          </li>
        ))}
      </ul>

      <div className="dashboard-card rounded-2xl px-3 py-2 sm:rounded-3xl">
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
