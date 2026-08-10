import { Suspense } from 'react';
import { StoreCategoriesWorkspace } from '@/components/stores/store-categories-workspace';

function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
      <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
    </div>
  );
}

export default function StoreCategoriesPage() {
  return (
    <Suspense fallback={<CategoriesLoading />}>
      <StoreCategoriesWorkspace />
    </Suspense>
  );
}
