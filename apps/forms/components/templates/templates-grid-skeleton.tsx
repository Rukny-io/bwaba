import { Skeleton } from '@heroui/react';

export function TemplatesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-44 rounded-3xl sm:h-48" />
      ))}
    </div>
  );
}
