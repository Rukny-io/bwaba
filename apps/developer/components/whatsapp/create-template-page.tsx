'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { FormDropdown } from '@/components/ui/form-dropdown';
import {
  whatsappBtnPrimary,
  whatsappBtnSecondary,
  whatsappInputClass,
} from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappAccounts, useWhatsappMutations } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
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

const labelClass = 'mb-1.5 block text-xs font-medium text-[var(--foreground)]';
const hintClass = 'mt-1.5 text-[11px] leading-relaxed text-[var(--muted-foreground)]';
const inputClass = whatsappInputClass;

const CATEGORY_LABEL_KEYS = {
  UTILITY: 'categoryUTILITY',
  MARKETING: 'categoryMARKETING',
  AUTHENTICATION: 'categoryAUTHENTICATION',
} as const;

export function CreateTemplatePage({
  appId,
  accountId: accountIdProp,
  backHref,
}: {
  appId: string;
  accountId?: string;
  backHref: string;
}) {
  const w = useTranslations().whatsapp;
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useWhatsappAccounts(appId);
  const accountId =
    accountIdProp ?? accounts?.find((a) => a.status === 'ACTIVE')?.id;
  const { createTemplateMutation } = useWhatsappMutations(appId);

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
    setForm((prev) => {
      const nextExamples: Record<number, string> = {};
      for (const variable of variables) {
        nextExamples[variable] = prev.bodyExamples[variable] ?? '';
      }
      return { ...prev, bodyExamples: nextExamples };
    });
  }, [variables]);

  function update<K extends keyof CreateTemplateFormState>(
    key: K,
    value: CreateTemplateFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!accountId) {
      setError(w.templatesNeedAccount);
      return;
    }

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

    createTemplateMutation.mutate(
      {
        accountId,
        name: normalizeTemplateName(form.name),
        language: form.language,
        category: form.category,
        components: buildTemplateComponents(form),
      },
      {
        onSuccess: () => {
          appToast.success(w.createTemplateSuccess);
          router.push(backHref);
        },
        onError: (e) => {
          const message = getApiErrorMessage(e, w.createTemplateFailed);
          setError(message);
          appToast.error(message);
        },
      },
    );
  }

  const isPending = createTemplateMutation.isPending;
  const previewBody = form.body.trim() || w.createTemplateBodyPlaceholder;

  if (accountsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="dashboard-section-stack">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-3.5" />
          {w.createTemplateCancel}
        </Link>
        <section className="dashboard-panel p-5">
          <h1 className="text-base font-semibold text-[var(--foreground)]">
            {w.createTemplate}
          </h1>
          <p className="mt-1.5 text-[13px] text-[var(--muted-foreground)]">
            {w.templatesNeedAccount}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-col gap-3">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-3.5" />
          {w.navTemplates}
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {w.createTemplate}
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
            {w.createTemplateDesc}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="dashboard-panel space-y-5 p-4 sm:p-5">
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
              <p className={hintClass}>{w.createTemplateNameHint}</p>
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
              rows={6}
              maxLength={1024}
              className={cn(inputClass, 'min-h-[9rem] resize-y')}
            />
            <p className={hintClass}>{w.createTemplateBodyHint}</p>
          </div>

          {variables.length > 0 ? (
            <div className="space-y-3 rounded-xl bg-[var(--surface-secondary)] p-4">
              <p className="text-[13px] font-semibold text-[var(--foreground)]">
                {w.createTemplateExamples}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
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

          <div className="space-y-2.5">
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
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--foreground)]"
              >
                <Plus className="size-3.5" />
                {w.createTemplateAddButton}
              </button>
            ) : null}
          </div>

          <p className={hintClass}>{w.createTemplateReviewNote}</p>

          {error ? (
            <p className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_8%,var(--background))] px-3.5 py-2.5 text-xs text-[var(--danger)]">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)]/40 pt-4">
            <button
              type="submit"
              disabled={isPending}
              className={cn(whatsappBtnPrimary, 'min-w-[9rem]')}
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isPending ? w.createTemplateSubmitting : w.createTemplateSubmit}
            </button>
            <Link href={backHref} className={whatsappBtnSecondary}>
              {w.createTemplateCancel}
            </Link>
          </div>
        </section>

        <aside className="dashboard-panel h-fit space-y-3 p-4 sm:sticky sm:top-20 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {w.createTemplatePreview}
          </p>
          <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
            <div className="mx-auto max-w-[16rem] space-y-1.5 rounded-2xl bg-[var(--background)] p-3 shadow-sm ring-1 ring-[var(--border)]/50">
              {form.header.trim() ? (
                <p className="text-[13px] font-semibold text-[var(--foreground)]">
                  {form.header}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--foreground)]">
                {previewBody}
              </p>
              {form.footer.trim() ? (
                <p className="text-[11px] text-[var(--muted-foreground)]">{form.footer}</p>
              ) : null}
              {form.quickReplyButtons.some((b) => b.trim()) ? (
                <div className="mt-2 space-y-1.5 border-t border-[var(--border)]/50 pt-2">
                  {form.quickReplyButtons
                    .filter((b) => b.trim())
                    .map((button, index) => (
                      <div
                        key={`${button}-${index}`}
                        className="rounded-lg bg-[var(--surface-secondary)] px-2.5 py-1.5 text-center text-[12px] font-medium text-[var(--foreground)]"
                      >
                        {button}
                      </div>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
            {form.language} · {form.category}
          </p>
        </aside>
      </form>
    </div>
  );
}
