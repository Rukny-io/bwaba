import { Suspense } from 'react';
import { FormsWorkspace } from '@/components/forms/forms-workspace';

function FormsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-40 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[5.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={<FormsLoading />}>
      <FormsWorkspace />
    </Suspense>
  );
}
