'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FileText, LayoutTemplate, Loader2, SearchX } from 'lucide-react';
import { FORM_LINK_TEMPLATES } from '@/lib/forms/form-link-templates';
import { listMyForms, type FormListItem } from '@/lib/forms/forms-api';
import { cn } from '@/lib/utils';

type FormCatalogTab = 'templates' | 'mine';

interface FormCatalogTabsProps {
  tab: FormCatalogTab;
  onTabChange: (tab: FormCatalogTab) => void;
  compact?: boolean;
}

export function FormCatalogTabs({ tab, onTabChange, compact }: FormCatalogTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 rounded-2xl bg-[var(--surface-secondary)]/70 p-1',
        compact && 'rounded-xl',
      )}
    >
      <button
        type="button"
        onClick={() => onTabChange('templates')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors active:scale-[0.98]',
          compact ? 'py-2 text-[12px]' : 'py-2.5 text-sm',
          tab === 'templates'
            ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)]',
        )}
      >
        <LayoutTemplate className={compact ? 'size-3.5' : 'size-4'} />
        قوالب جاهزة
      </button>
      <button
        type="button"
        onClick={() => onTabChange('mine')}
        className={cn(
          'flex flex-1 items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors active:scale-[0.98]',
          compact ? 'py-2 text-[12px]' : 'py-2.5 text-sm',
          tab === 'mine'
            ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
            : 'text-[var(--muted-foreground)]',
        )}
      >
        <FileText className={compact ? 'size-3.5' : 'size-4'} />
        نماذجي
      </button>
    </div>
  );
}

interface FormCatalogPanelProps {
  search?: string;
  onPickTemplate: (templateId: string) => void;
  onPickForm: (form: FormListItem) => void;
  variant?: 'default' | 'compact';
  tab?: FormCatalogTab;
  onTabChange?: (tab: FormCatalogTab) => void;
  hideTabs?: boolean;
  myForms?: FormListItem[];
  loadingForms?: boolean;
  formsError?: string | null;
}

export function FormCatalogPanel({
  search = '',
  onPickTemplate,
  onPickForm,
  variant = 'default',
  tab: controlledTab,
  onTabChange,
  hideTabs = false,
  myForms: externalForms,
  loadingForms: externalLoading,
  formsError: externalError,
}: FormCatalogPanelProps) {
  const [internalTab, setInternalTab] = useState<FormCatalogTab>('templates');
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const [internalForms, setInternalForms] = useState<FormListItem[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const myForms = externalForms ?? internalForms;
  const loadingForms = externalLoading ?? internalLoading;
  const error = externalError ?? internalError;
  const compact = variant === 'compact';

  const q = search.trim().toLowerCase();

  const filteredTemplates = useMemo(() => {
    if (!q) return FORM_LINK_TEMPLATES;
    return FORM_LINK_TEMPLATES.filter((template) => {
      const haystack = `${template.title} ${template.description} ${template.suggestedTitle}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [q]);

  const filteredMyForms = useMemo(() => {
    if (!q) return myForms;
    return myForms.filter((form) => {
      const haystack = `${form.title} ${form.slug}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [myForms, q]);

  useEffect(() => {
    if (externalForms !== undefined) return;
    if (tab !== 'mine') return;

    let cancelled = false;
    setInternalLoading(true);
    listMyForms({ status: 'PUBLISHED', limit: 50 })
      .then((res) => {
        if (!cancelled) setInternalForms(res.forms);
      })
      .catch(() => {
        if (!cancelled) setInternalError('تعذر تحميل نماذجك');
      })
      .finally(() => {
        if (!cancelled) setInternalLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, externalForms]);

  function TemplateRow({
    title,
    description,
    onClick,
  }: {
    title: string;
    description: string;
    onClick: () => void;
  }) {
    if (compact) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-start active:bg-[var(--surface-secondary)] active:scale-[0.995]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/50">
            <LayoutTemplate className="size-4 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">{title}</p>
            <p className="truncate text-[11px] text-[var(--muted-foreground)]">{description}</p>
          </div>
          <ChevronRight
            className="size-4 shrink-0 rotate-180 text-[var(--muted-foreground)] opacity-40"
            aria-hidden
          />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-start transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--surface-secondary)]/40"
      >
        <span className="text-[14px] font-semibold text-[var(--foreground)]">{title}</span>
        <span className="text-xs leading-relaxed text-[var(--muted-foreground)]">{description}</span>
      </button>
    );
  }

  return (
    <div className={cn(!hideTabs && 'space-y-4')}>
      {!hideTabs ? <FormCatalogTabs tab={tab} onTabChange={setTab} compact={compact} /> : null}

      {error ? (
        <p className="px-1 py-2 text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'templates' ? (
        filteredTemplates.length === 0 ? (
          <EmptyState compact={compact} message="لا توجد قوالب مطابقة" />
        ) : (
          <ul className={cn(compact ? 'flex flex-col' : 'grid gap-2 sm:grid-cols-2')}>
            {filteredTemplates.map((template) => (
              <li key={template.id}>
                <TemplateRow
                  title={template.title}
                  description={template.description}
                  onClick={() => onPickTemplate(template.id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : loadingForms ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : filteredMyForms.length === 0 ? (
        <EmptyState
          compact={compact}
          message={q ? 'لا توجد نماذج مطابقة' : 'لا توجد نماذج منشورة'}
          hint={!q ? 'أنشئ نموذجاً من قالب جاهز أو من تطبيق النماذج' : undefined}
        />
      ) : (
        <ul className={cn('flex flex-col', !compact && 'gap-2')}>
          {filteredMyForms.map((form) => (
            <li key={form.id}>
              {compact ? (
                <button
                  type="button"
                  onClick={() => onPickForm(form)}
                  className="group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-start active:bg-[var(--surface-secondary)] active:scale-[0.995]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/50">
                    <FileText className="size-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">
                      {form.title}
                    </p>
                    <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                      /f/{form.slug}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 rotate-180 text-[var(--muted-foreground)] opacity-40"
                    aria-hidden
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onPickForm(form)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-start transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--surface-secondary)]/40"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/50">
                    <FileText className="size-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">{form.title}</p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">/f/{form.slug}</p>
                  </div>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  compact,
  message,
  hint,
}: {
  compact?: boolean;
  message: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-2 py-14' : 'rounded-2xl border border-dashed border-[var(--border)] px-4 py-10',
      )}
    >
      <SearchX className="mb-2 size-6 text-[var(--muted-foreground)]/60" />
      <p className="text-sm font-medium text-[var(--foreground)]">{message}</p>
      {hint ? (
        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-[var(--muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
