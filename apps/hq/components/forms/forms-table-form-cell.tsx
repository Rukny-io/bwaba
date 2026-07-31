'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import type { AdminForm } from '@/lib/types/forms';
import { getFormPreviewUrl } from '@/lib/forms-url';
import { TableHint } from '@/components/shared/table-hint';
import { cn } from '@/lib/utils';

interface FormsTableFormCellProps {
  form: AdminForm;
  className?: string;
  linkToDetail?: boolean;
}

export function FormsTableFormCell({
  form,
  className,
  linkToDetail = true,
}: FormsTableFormCellProps) {
  const previewUrl = getFormPreviewUrl(form.slug);
  const title = linkToDetail ? (
    <Link
      href={`/app/forms/${form.id}`}
      className="block truncate text-sm font-medium leading-snug text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
      title={`Open details for ${form.title}`}
    >
      {form.title}
    </Link>
  ) : (
    <p className="truncate text-sm font-medium leading-snug text-[var(--foreground)]">
      {form.title}
    </p>
  );

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        <FileText className="size-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        {title}
        <TableHint
          content={`Slug: /${form.slug}\nPreview: ${previewUrl}`}
          ariaLabel="Form slug and preview URL"
        >
          <p
            className="truncate font-mono text-[11px] leading-snug text-[var(--muted-foreground)]"
            dir="ltr"
          >
            /{form.slug}
          </p>
        </TableHint>
      </div>
    </div>
  );
}
