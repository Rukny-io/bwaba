import { Skeleton } from '@heroui/react';

export default function FormPreviewLoading() {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <Skeleton className="mx-auto h-9 max-w-2xl rounded-xl" />
      </div>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <Skeleton className="h-[32rem] w-full rounded-2xl" />
      </div>
    </div>
  );
}
