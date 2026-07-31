'use client';

import Link from 'next/link';
import { ExternalLink, Eye, Inbox } from 'lucide-react';
import { Chip } from '@heroui/react';
import type { AdminForm } from '@/lib/types/forms';
import { FormsTableFormCell } from '@/components/forms/forms-table-form-cell';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { getFormPreviewUrl } from '@/lib/forms-url';
import {
  formatFormDate,
  formatFormMetric,
  formatFormStatus,
  formStatusChipColor,
} from '@/lib/forms-format';
import { ClientPagination } from '@/components/shared/client-pagination';

interface FormsMobileListProps {
  forms: AdminForm[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function FormsMobileSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          key={`forms-mobile-loading-${index}`}
          className="h-[8.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
        />
      ))}
    </ul>
  );
}

export function FormsMobileList({
  forms,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: FormsMobileListProps) {
  if (isLoading) {
    return <FormsMobileSkeleton />;
  }

  if (forms.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No forms found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search term or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {forms.map((form) => (
          <li key={form.id}>
            <div className="rounded-2xl bg-[var(--surface-secondary)]/55 p-3">
              <Link href={`/app/forms/${form.id}`} className="block">
                <FormsTableFormCell form={form} linkToDetail={false} />
              </Link>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {form.deletedAt ? (
                  <Chip color="danger" size="sm" variant="soft">
                    Deleted
                  </Chip>
                ) : (
                  <Chip color={formStatusChipColor(form.status)} size="sm" variant="soft">
                    {formatFormStatus(form.status)}
                  </Chip>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  <Inbox className="size-3" />
                  {formatFormMetric(form.submissionCount)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  <Eye className="size-3" />
                  {formatFormMetric(form.viewCount)}
                </span>
              </div>

              <div className="mt-3 border-t border-[var(--border)]/40 pt-3">
                <FormsTableOwnerCell owner={form.owner} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <time
                  className="text-[11px] text-[var(--muted-foreground)]"
                  dateTime={form.createdAt}
                >
                  {formatFormDate(form.createdAt)}
                </time>
                <a
                  href={getFormPreviewUrl(form.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--primary)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <ExternalLink className="size-3" />
                  Preview
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-[var(--surface-secondary)]/40 px-2 py-2">
        <ClientPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
