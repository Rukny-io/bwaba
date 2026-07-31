import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LinkDetailView } from '@/components/app/links/link-detail/link-detail-view';

function DetailLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
    </div>
  );
}

export default async function LinkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="w-full pt-0.75 sm:pt-1.25">
      <Suspense fallback={<DetailLoading />}>
        <LinkDetailView linkId={id} />
      </Suspense>
    </div>
  );
}
