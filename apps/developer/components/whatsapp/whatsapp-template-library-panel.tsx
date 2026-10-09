'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { FormDropdown } from '@/components/ui/form-dropdown';
import {
  WhatsappEmptyState,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
  whatsappInputClass,
} from '@/components/whatsapp/whatsapp-ui';
import {
  useWhatsappMutations,
  useWhatsappTemplateLibrary,
} from '@/hooks/use-whatsapp';
import type { WhatsappLibraryTemplate } from '@/lib/api/types';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  buildDefaultLibraryButtonInputs,
  defaultLibraryTemplateName,
  fillLibraryBodyPreview,
  libraryTemplateNeedsButtonInputs,
} from '@/lib/whatsapp-template-library';
import { normalizeTemplateName } from '@/lib/whatsapp-template-builder';
import { TEMPLATE_LANGUAGES } from '@/lib/whatsapp-template-builder';
import { cn } from '@/lib/utils';

const LIBRARY_TOPICS = [
  'ACCOUNT_UPDATE',
  'CUSTOMER_FEEDBACK',
  'ORDER_MANAGEMENT',
  'PAYMENTS',
] as const;

function LibraryTemplateCard({
  template,
  onUse,
}: {
  template: WhatsappLibraryTemplate;
  onUse: () => void;
}) {
  const w = useTranslations().whatsapp;
  const preview = fillLibraryBodyPreview(template.body, template.body_params);

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]"
    >
      <div className="flex-1 p-4">
        <div className="rounded-xl bg-[#ECE5DD] p-3 text-start">
          {template.header ? (
            <p className="text-[12px] font-semibold text-[#1D1D1D]">{template.header}</p>
          ) : null}
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#1D1D1D]">
            {preview || template.name}
          </p>
          {template.footer ? (
            <p className="mt-2 text-[11px] text-[#6B6F76]">{template.footer}</p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-[var(--border)] px-4 py-3">
        <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
          {template.name}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
          {template.category} · {template.language}
        </p>
        <button type="button" onClick={onUse} className={`${whatsappBtnSecondary} mt-3 w-full`}>
          {w.libraryUseTemplate}
        </button>
      </div>
    </article>
  );
}

function UseLibraryTemplateDialog({
  appId,
  accountId,
  template,
  onClose,
  onSuccess,
}: {
  appId: string;
  accountId: string;
  template: WhatsappLibraryTemplate;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const w = useTranslations().whatsapp;
  const { createFromLibraryMutation } = useWhatsappMutations(appId);
  const [name, setName] = useState(() => defaultLibraryTemplateName(template.name));
  const [urlBase, setUrlBase] = useState('https://example.com/{{1}}');
  const [phone, setPhone] = useState('+9640000000000');

  const needsButtons = libraryTemplateNeedsButtonInputs(template);
  const hasUrlButton = template.buttons?.some((b) => b.type === 'URL');
  const hasPhoneButton = template.buttons?.some((b) => b.type === 'PHONE_NUMBER');

  const category =
    template.category === 'AUTHENTICATION' ? 'AUTHENTICATION' : 'UTILITY';

  function submit() {
    const normalized = normalizeTemplateName(name);
    if (!normalized) {
      appToast.error(w.createTemplateNameInvalid);
      return;
    }

    let libraryTemplateButtonInputs: unknown[] | undefined;
    if (needsButtons) {
      const defaults = buildDefaultLibraryButtonInputs(template);
      libraryTemplateButtonInputs = defaults.map((item) => {
        const entry = item as { type: string; url?: { base_url: string; url_suffix_example: string }; phone_number?: string };
        if (entry.type === 'URL' && entry.url) {
          return {
            type: 'URL',
            url: {
              base_url: urlBase,
              url_suffix_example: urlBase.replace('{{1}}', 'demo'),
            },
          };
        }
        if (entry.type === 'PHONE_NUMBER') {
          return { type: 'PHONE_NUMBER', phone_number: phone };
        }
        return item;
      });
    }

    createFromLibraryMutation.mutate(
      {
        accountId,
        name: normalized,
        language: template.language,
        category,
        libraryTemplateName: template.name,
        libraryTemplateButtonInputs,
        ...(category === 'AUTHENTICATION'
          ? { libraryTemplateBodyInputs: { add_security_recommendation: true } }
          : {}),
      },
      {
        onSuccess: () => {
          appToast.success(w.libraryCreateSuccess);
          onSuccess();
          onClose();
        },
        onError: (e) => appToast.error(getApiErrorMessage(e, w.libraryCreateFailed)),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#1D1D1D]/30"
        aria-label={w.createTemplateCancel}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          {w.libraryUseTemplate}
        </h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{template.name}</p>

        <label className="mt-4 block text-xs font-medium text-[var(--foreground)]">
          {w.templateName}
          <input
            className={`${whatsappInputClass} mt-1.5`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        {hasUrlButton ? (
          <label className="mt-3 block text-xs font-medium text-[var(--foreground)]">
            {w.libraryButtonUrl}
            <input
              className={`${whatsappInputClass} mt-1.5`}
              value={urlBase}
              onChange={(e) => setUrlBase(e.target.value)}
              dir="ltr"
            />
          </label>
        ) : null}

        {hasPhoneButton ? (
          <label className="mt-3 block text-xs font-medium text-[var(--foreground)]">
            {w.libraryButtonPhone}
            <input
              className={`${whatsappInputClass} mt-1.5`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={createFromLibraryMutation.isPending}
            onClick={submit}
            className={whatsappBtnPrimary}
          >
            {createFromLibraryMutation.isPending ? w.createTemplateSubmitting : w.libraryAddToWaba}
          </button>
          <button type="button" onClick={onClose} className={whatsappBtnSecondary}>
            {w.createTemplateCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsappTemplateLibraryPanel({
  appId,
  accountId,
  onAdded,
}: {
  appId: string;
  accountId?: string;
  onAdded?: () => void;
}) {
  const w = useTranslations().whatsapp;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [language, setLanguage] = useState('en_US');
  const [topic, setTopic] = useState<string>('');
  const [category, setCategory] = useState<'UTILITY' | 'AUTHENTICATION' | ''>('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [accumulated, setAccumulated] = useState<WhatsappLibraryTemplate[]>([]);
  const [picked, setPicked] = useState<WhatsappLibraryTemplate | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setCursor(undefined);
    setAccumulated([]);
  }, [debouncedSearch, language, topic, category]);

  const query = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      language: language || undefined,
      topic: topic || undefined,
      limit: 24,
      after: cursor,
    }),
    [debouncedSearch, language, topic, cursor],
  );

  const { data, isLoading, isFetching, error } = useWhatsappTemplateLibrary(
    appId,
    accountId,
    query,
  );

  useEffect(() => {
    const batch = data?.data ?? [];
    if (!batch.length && !cursor) {
      setAccumulated([]);
      return;
    }
    if (!cursor) {
      setAccumulated(batch);
      return;
    }
    setAccumulated((prev) => {
      const seen = new Set(prev.map((t) => t.id));
      const next = batch.filter((t) => !seen.has(t.id));
      return next.length ? [...prev, ...next] : prev;
    });
  }, [data?.data, cursor]);

  const items = useMemo(() => {
    if (!category) return accumulated;
    return accumulated.filter((t) => t.category === category);
  }, [accumulated, category]);

  const nextCursor = data?.paging?.cursors?.after;

  const languageOptions = useMemo(
    () =>
      TEMPLATE_LANGUAGES.map((opt) => {
        const id =
          opt.value === 'en' ? 'en_US' : opt.value === 'ar' ? 'ar' : opt.value;
        return { id, label: w[opt.labelKey] };
      }),
    [w],
  );

  if (!accountId) {
    return (
      <WhatsappEmptyState icon={BookOpen} title={w.templatesNeedAccount} />
    );
  }

  return (
    <div className="dashboard-section-stack">
      <p className="text-sm text-[var(--muted-foreground)]">{w.libraryDesc}</p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={w.librarySearchPlaceholder}
            className={`${whatsappInputClass} ps-9`}
          />
        </div>
        <FormDropdown
          label={w.templateLanguage}
          value={language}
          onChange={setLanguage}
          options={languageOptions}
          className="w-full sm:w-48"
        />
        <FormDropdown
          label={w.libraryTopicFilter}
          value={topic}
          onChange={setTopic}
          options={[
            { id: '', label: w.libraryAllTopics },
            ...LIBRARY_TOPICS.map((t) => ({ id: t, label: t.replace(/_/g, ' ') })),
          ]}
          className="w-full sm:w-52"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', 'UTILITY', 'AUTHENTICATION'] as const).map((value) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
              category === value
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
          >
            {value === ''
              ? w.libraryAllCategories
              : value === 'UTILITY'
                ? w.categoryUTILITY
                : w.categoryAUTHENTICATION}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-[var(--destructive)]">{getApiErrorMessage(error)}</p>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !items.length ? (
        <WhatsappEmptyState
          icon={BookOpen}
          title={w.libraryEmpty}
          description={w.libraryEmptyDesc}
        />
      ) : (
        <>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {w.libraryResultsCount.replace('{count}', String(items.length))}
            {isFetching ? ' …' : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((template) => (
              <LibraryTemplateCard
                key={`${template.id}-${template.name}`}
                template={template}
                onUse={() => setPicked(template)}
              />
            ))}
          </div>
          {nextCursor ? (
            <button
              type="button"
              disabled={isFetching}
              onClick={() => setCursor(nextCursor)}
              className={whatsappBtnSecondary}
            >
              {w.libraryLoadMore}
            </button>
          ) : null}
        </>
      )}

      {picked ? (
        <UseLibraryTemplateDialog
          appId={appId}
          accountId={accountId}
          template={picked}
          onClose={() => setPicked(null)}
          onSuccess={() => onAdded?.()}
        />
      ) : null}
    </div>
  );
}
