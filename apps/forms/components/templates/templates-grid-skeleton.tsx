import { Skeleton } from '@heroui/react';

export function TemplatesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="dashboard-card flex h-full flex-col gap-3 rounded-2xl p-3.5 sm:rounded-3xl sm:p-4"
        >
          <Skeleton className="h-6 w-20 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-3 w-4/5 rounded-lg" />
          <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
