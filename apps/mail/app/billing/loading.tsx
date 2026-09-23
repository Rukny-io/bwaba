import { Skeleton } from "@heroui/react";

export default function BillingLoading() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}
