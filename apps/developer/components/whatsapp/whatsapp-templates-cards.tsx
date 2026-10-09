'use client';

import { useMemo, useState } from 'react';
import { CircleX, ListFilter, Loader2, Search, Trash2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import type { WhatsappTemplate } from '@/lib/api/types';
import { templateComponentsPreview } from '@/lib/whatsapp-template-preview';
import {
  templateStatusTone,
  WhatsappTemplateTile,
} from '@/components/whatsapp/whatsapp-template-tile';
import { cn } from '@/lib/utils';

function categoryLabel(
  category: string,
  w: { categoryUTILITY: string; categoryAUTHENTICATION: string; categoryMARKETING: string },
) {
  const c = category.toUpperCase();
  if (c === 'UTILITY') return w.categoryUTILITY;
  if (c === 'AUTHENTICATION') return w.categoryAUTHENTICATION;
  if (c === 'MARKETING') return w.categoryMARKETING;
  return category;
}

function TemplateCard({
  template,
  statusLabel,
  categoryText,
  onDelete,
  deleting,
  deleteLabel,
  deleteConfirm,
}: {
  template: WhatsappTemplate;
  statusLabel: (status: string) => string;
  categoryText: string;
  onDelete?: (name: string) => void;
  deleting: boolean;
  deleteLabel: string;
  deleteConfirm: string;
}) {
  const preview = templateComponentsPreview(template.components);
  const bodyText =
    [preview.header, preview.body, preview.footer].filter(Boolean).join(' · ') ||
    template.name;

  return (
    <WhatsappTemplateTile
      metaLabel={categoryText}
      title={template.name}
      preview={bodyText}
      footerPrimary={statusLabel(template.status)}
      footerPrimaryTone={templateStatusTone(template.status)}
      footerExtra={template.language}
      headerActions={
        onDelete ? (
          <button
            type="button"
            disabled={deleting}
            aria-label={deleteLabel}
            title={deleteLabel}
            onClick={() => {
              const msg = deleteConfirm.replace('{name}', template.name);
              if (!window.confirm(msg)) return;
              onDelete(template.name);
            }}
            className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)] disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
            )}
          </button>
        ) : null
      }
    />
  );
}

export function WhatsappTemplatesCards({
  data,
  onDelete,
  deletingName,
}: {
  data: WhatsappTemplate[];
  onDelete?: (name: string) => void;
  deletingName?: string | null;
}) {
  const w = useTranslations().whatsapp;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const statusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED') return w.templateStatusApproved;
    if (s === 'PENDING') return w.templateStatusPending;
    if (s === 'REJECTED') return w.templateStatusRejected;
    return status;
  };

  const statusOptions = useMemo(() => {
    const set = new Set(data.map((t) => t.status.toUpperCase()));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((t) => {
      if (statusFilter && t.status.toUpperCase() !== statusFilter) return false;
      if (!q) return true;
      return `${t.name} ${t.language} ${t.category}`.toLowerCase().includes(q);
    });
  }, [data, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={w.tableFilterTemplates}
            aria-label={w.tableFilterTemplates}
            className={cn(
              'h-9 w-full rounded-xl border border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 pe-9 ps-9 text-[13px]',
              'outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
            )}
          />
          {search ? (
            <button
              type="button"
              className="absolute end-0 top-0 flex h-9 w-9 items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={w.tableClearFilter}
              onClick={() => setSearch('')}
            >
              <CircleX className="size-4" aria-hidden />
            </button>
          ) : (
            <ListFilter
              className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)] opacity-50"
              aria-hidden
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
              !statusFilter
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {w.libraryAllCategories}
          </button>
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                statusFilter === status
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {statusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          {w.tableNoResults}
        </p>
      ) : (
        <>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {w.libraryResultsCount.replace('{count}', String(filtered.length))}
          </p>
          <div className="grid auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
            {filtered.map((template) => (
              <TemplateCard
                key={`${template.id}-${template.name}-${template.language}`}
                template={template}
                statusLabel={statusLabel}
                categoryText={categoryLabel(template.category, w)}
                onDelete={onDelete}
                deleting={deletingName === template.name}
                deleteLabel={w.deleteTemplate}
                deleteConfirm={w.deleteTemplateConfirm}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
