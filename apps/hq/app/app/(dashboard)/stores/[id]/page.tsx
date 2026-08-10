import { Suspense } from 'react';
import { StoreDetailView } from '@/components/stores/store-detail-view';

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      }
    >
      <StoreDetailView storeId={id} />
    </Suspense>
  );
}
