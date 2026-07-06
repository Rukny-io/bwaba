import { Suspense } from 'react';
import { FormDetailView } from '@/components/forms/form-detail-view';

export default async function FormDetailPage({
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
      <FormDetailView formId={id} />
    </Suspense>
  );
}
