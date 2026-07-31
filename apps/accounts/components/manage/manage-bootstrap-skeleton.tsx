"use client";

import { cn } from "@/lib/utils";
import { ui } from "./manage-ui";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/60", className)} />;
}

export function ManageBootstrapSkeleton() {
  return (
    <div className={cn("min-h-dvh text-foreground", ui.canvas)}>
      <div className="mx-auto flex w-full max-w-5xl">
        <aside className="sticky top-0 hidden h-dvh w-[280px] shrink-0 flex-col border-s border-border/60 py-6 ps-6 lg:flex">
          <Bone className="mx-3 mb-6 h-6 w-32" />
          <div className="flex flex-col gap-2 px-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Bone key={i} className="h-10 w-full rounded-full" />
            ))}
          </div>
          <div className="mt-auto px-3 pt-6">
            <Bone className="h-24 w-full rounded-2xl" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <Bone className="mb-6 h-24 w-full rounded-[20px]" />
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Bone key={i} className="h-16 rounded-[20px]" />
            ))}
          </div>
          <Bone className="mb-2 h-4 w-24" />
          <Bone className="h-40 w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
