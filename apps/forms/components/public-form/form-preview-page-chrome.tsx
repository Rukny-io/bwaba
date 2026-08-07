'use client';

import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFormCreatingPath } from '@/lib/forms-paths';

interface FormPreviewPageChromeProps {
  slug: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

const toolbarClusterClass =
  'inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] p-1';

export function FormPreviewPageChrome({
  slug,
  backHref,
  backLabel = 'متابعة التحرير',
  className,
}: FormPreviewPageChromeProps) {
  const editHref = backHref ?? getFormCreatingPath(slug);

  return (
    <header
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-30 bg-[var(--background)]/75 backdrop-blur-xl',
        className,
      )}
    >
      <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className={toolbarClusterClass}>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
            <Eye className="size-4 shrink-0" strokeWidth={1.8} />
            معاينة — كما يراه الزوار
          </span>
        </div>

        <div className={toolbarClusterClass}>
          <Link
            href={editHref}
            aria-label={backLabel}
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold sm:px-4',
              'bg-[var(--primary)] text-[var(--primary-foreground)] transition-opacity hover:opacity-90',
            )}
          >
            <Pencil className="size-4" strokeWidth={2.2} />
            <span className="hidden sm:inline">{backLabel}</span>
            <span className="sm:hidden">تحرير</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
