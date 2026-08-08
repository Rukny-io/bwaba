import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { CollectionsView } from '@/components/products/collections-view';

function CollectionsLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
    </div>
  );
}

export default function ProductCollectionsPage() {
  return (
    <Suspense fallback={<CollectionsLoading />}>
      <CollectionsView />
    </Suspense>
  );
}
