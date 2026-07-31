import { Suspense } from 'react';
import { UsersWorkspace } from '@/components/users/users-workspace';

function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[7.25rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:min-h-[8.5rem] sm:rounded-3xl"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
    </div>
  );
}

export default async function UsersPage() {
  return (
    <Suspense fallback={<UsersLoading />}>
      <UsersWorkspace />
    </Suspense>
  );
}
