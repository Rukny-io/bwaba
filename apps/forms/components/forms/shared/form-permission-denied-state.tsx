'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

export function FormPermissionDeniedState({
  title = 'صلاحية غير كافية',
  description,
  actionHref,
  actionLabel = 'العودة لإعدادات النموذج',
  className,
}: {
  title?: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/25 px-6 py-12 text-center sm:px-10',
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted-foreground)]">
        <Lock className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
        {description}
      </p>
      {actionHref ? (
        <Link href={actionHref} className="mt-6">
          <Button variant="secondary" className="rounded-full px-5">
            {actionLabel}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
