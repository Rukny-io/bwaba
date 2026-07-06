'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, ScrollText, X } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { FormDropdown } from '@/components/ui/form-dropdown';
import {
  EMPTY_TEMPLATE_FORM,
  TEMPLATE_CATEGORIES,
  TEMPLATE_LANGUAGES,
  buildTemplateComponents,
  extractTemplateVariables,
  normalizeTemplateName,
  validateCreateTemplateForm,
  type CreateTemplateFormState,
} from '@/lib/whatsapp-template-builder';
import { cn } from '@/lib/utils';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--primary)]';

const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--foreground)]';

const CATEGORY_LABEL_KEYS = {
  UTILITY: 'categoryUTILITY',
  MARKETING: 'categoryMARKETING',
  AUTHENTICATION: 'categoryAUTHENTICATION',
} as const;

interface CreateTemplateDialogProps {
  open: boolean;
  accountId?: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    accountId?: string;
    name: string;
    language: string;
    category: string;
    components: Record<string, unknown>[];
  }) => void;
}

export function CreateTemplateDialog({
  open,
  accountId,
  isPending,
  onClose,
  onSubmit,
}: CreateTemplateDialogProps) {
  const w = useTranslations().whatsapp;
  const [form, setForm] = useState<CreateTemplateFormState>(EMPTY_TEMPLATE_FORM);
  const [error, setError] = useState<string | null>(null);

  const variables = useMemo(() => extractTemplateVariables(form.body), [form.body]);

  const languageOptions = useMemo(
    () =>
      TEMPLATE_LANGUAGES.map((lang) => ({
        id: lang.value,
        label: w[lang.labelKey],
      })),
    [w],
  );

  const categoryOptions = useMemo(
    () =>
      TEMPLATE_CATEGORIES.map((cat) => ({
        id: cat,
        label: w[CATEGORY_LABEL_KEYS[cat]],
      })),
    [w],
  );

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_TEMPLATE_FORM);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    setForm((prev) => {
      const nextExamples = { ...prev.bodyExamples };
      for (const variable of variables) {
        if (!(variable in nextExamples)) {
          nextExamples[variable] = '';
        }
      }
      return { ...prev, bodyExamples: nextExamples };
    });
  }, [variables]);

  if (!open) return null;

  function update<K extends keyof CreateTemplateFormState>(
    key: K,
    value: CreateTemplateFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validateCreateTemplateForm(form, {
      nameRequired: w.createTemplateNameRequired,
      nameInvalid: w.createTemplateNameInvalid,
      bodyRequired: w.createTemplateBodyRequired,
      examplesRequired: w.createTemplateExamplesRequired,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    onSubmit({
      accountId,
      name: normalizeTemplateName(form.name),
      language: form.language,
      category: form.category,
      components: buildTemplateComponents(form),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={w.createTemplateCancel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="dashboard-card relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
              <ScrollText className="size-5" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {w.createTemplate}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {w.createTemplateDesc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <X className="size-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>{w.templateName}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  onBlur={() => update('name', normalizeTemplateName(form.name))}
                  placeholder="order_ready"
                  className={cn(inputClass, 'font-mono')}
                  dir="ltr"
                />
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                  {w.createTemplateNameHint}
                </p>
              </div>

              <FormDropdown
                label={w.templateLanguage}
                value={form.language}
                options={languageOptions}
                placeholder={w.selectOption}
                onChange={(language) => update('language', language)}
              />

              <FormDropdown
                label={w.templateCategory}
                value={form.category}
                options={categoryOptions}
                placeholder={w.selectOption}
                onChange={(category) =>
                  update('category', category as CreateTemplateFormState['category'])
                }
              />
            </div>

            <div>
              <label className={labelClass}>{w.createTemplateHeader}</label>
              <input
                type="text"
                value={form.header}
                onChange={(e) => update('header', e.target.value)}
                placeholder={w.createTemplateHeaderPlaceholder}
                maxLength={60}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{w.createTemplateBody}</label>
              <textarea
                value={form.body}
                onChange={(e) => update('body', e.target.value)}
                placeholder={w.createTemplateBodyPlaceholder}
                rows={4}
                maxLength={1024}
                className={cn(inputClass, 'resize-y')}
              />
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                {w.createTemplateBodyHint}
              </p>
            </div>

            {variables.length > 0 ? (
              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                <p className="text-xs font-medium text-[var(--foreground)]">
                  {w.createTemplateExamples}
                </p>
                {variables.map((variable) => (
                  <div key={variable}>
                    <label className={labelClass}>
                      {w.createTemplateExampleFor.replace('{n}', String(variable))}
                    </label>
                    <input
                      type="text"
                      value={form.bodyExamples[variable] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          bodyExamples: {
                            ...prev.bodyExamples,
                            [variable]: e.target.value,
                          },
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div>
              <label className={labelClass}>{w.createTemplateFooter}</label>
              <input
                type="text"
                value={form.footer}
                onChange={(e) => update('footer', e.target.value)}
                placeholder={w.createTemplateFooterPlaceholder}
                maxLength={60}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>{w.createTemplateButtons}</label>
              {form.quickReplyButtons.map((button, index) => (
                <input
                  key={index}
                  type="text"
                  value={button}
                  onChange={(e) => {
                    const next = [...form.quickReplyButtons];
                    next[index] = e.target.value;
                    update('quickReplyButtons', next);
                  }}
                  placeholder={w.createTemplateButtonPlaceholder}
                  maxLength={25}
                  className={inputClass}
                />
              ))}
              {form.quickReplyButtons.length < 3 ? (
                <button
                  type="button"
                  onClick={() =>
                    update('quickReplyButtons', [...form.quickReplyButtons, ''])
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]"
                >
                  <Plus className="size-3.5" />
                  {w.createTemplateAddButton}
                </button>
              ) : null}
            </div>

            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              {w.createTemplateReviewNote}
            </p>

            {error ? (
              <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,var(--background))] px-3 py-2 text-xs text-[var(--danger)]">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex justify-end gap-2 border-t border-[var(--border)] p-5 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-50"
            >
              {w.createTemplateCancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isPending ? w.createTemplateSubmitting : w.createTemplateSubmit}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
