'use client';

import { useMemo, useState } from 'react';
import { CircleX, ListFilter, Loader2, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/components/providers/translations-provider';
import type { WhatsappTemplate } from '@/lib/api/types';
import { templateComponentsPreview } from '@/lib/whatsapp-template-preview';
import { whatsappBtnSecondary } from '@/components/whatsapp/whatsapp-ui';
import { cn } from '@/lib/utils';

function statusBadgeVariant(status: string) {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'success' as const;
  if (s === 'PENDING') return 'warning' as const;
  if (s === 'REJECTED') return 'destructive' as const;
  return 'secondary' as const;
}

function TemplateCard({
  template,
  statusLabel,
  onDelete,
  deleting,
  deleteLabel,
  deleteConfirm,
}: {
  template: WhatsappTemplate;
  statusLabel: (status: string) => string;
  onDelete?: (name: string) => void;
  deleting: boolean;
  deleteLabel: string;
  deleteConfirm: string;
}) {
  const preview = templateComponentsPreview(template.components);
  const bodyText = preview.body ?? template.name;

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-3">
        <Badge variant={statusBadgeVariant(template.status)}>
          {statusLabel(template.status)}
        </Badge>
        <span
          dir="ltr"
          className="truncate text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]"
        >
          {template.category}
        </span>
      </div>

      <div className="flex-1 p-4">
        <div className="rounded-xl bg-[#ECE5DD] p-3 text-start">
          {preview.header ? (
            <p className="text-[12px] font-semibold text-[#1D1D1D]">{preview.header}</p>
          ) : null}
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#1D1D1D]">
            {bodyText}
          </p>
          {preview.footer ? (
            <p className="mt-2 text-[11px] text-[#6B6F76]">{preview.footer}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <p className="truncate font-mono text-[12px] font-medium text-[var(--foreground)]" dir="ltr">
          {template.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]" dir="ltr">
          {template.language}
        </p>
        {onDelete ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              const msg = deleteConfirm.replace('{name}', template.name);
              if (!window.confirm(msg)) return;
              onDelete(template.name);
            }}
            className={cn(
              whatsappBtnSecondary,
              'mt-3 w-full text-[var(--muted-foreground)] hover:text-[var(--danger)]',
            )}
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            {deleteLabel}
          </button>
        ) : null}
      </div>
    </article>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((template) => (
              <TemplateCard
                key={`${template.id}-${template.name}-${template.language}`}
                template={template}
                statusLabel={statusLabel}
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
