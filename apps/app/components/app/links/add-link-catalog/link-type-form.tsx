'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import {
  buildLinkFromType,
  getLinkFormFields,
  validateLinkForm,
  type LinkFormValues,
} from '@/lib/links/build-link-from-type';
import type { LinkCatalogItem } from '@/lib/links/link-type-catalog';
import type { CreateSocialLinkInput } from '@/lib/links/types';

interface LinkTypeFormProps {
  item: LinkCatalogItem;
  onBack: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
}

export function LinkTypeForm({ item, onBack, onSubmit }: LinkTypeFormProps) {
  const fields = getLinkFormFields(item.id);
  const [values, setValues] = useState<LinkFormValues>({ title: '', value: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsValue = item.id !== 'header' && item.id !== 'text';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateLinkForm(item.id, values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = buildLinkFromType(item.id, item.platform, values);
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الحفظ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" dir="rtl">
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)]/70 px-5 py-3.5">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-all hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          aria-label="رجوع"
        >
          <ArrowRight className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LinkPlatformIconBadge type={item.id} size="sm" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--foreground)]">{item.label}</h3>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{item.description}</p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
        <div className="space-y-4">
          {fields.showTitle ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">{fields.titleLabel}</label>
              <input
                type="text"
                value={values.title}
                onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                placeholder={fields.titlePlaceholder}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--field-background)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          ) : null}

          {needsValue ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">{fields.valueLabel}</label>
              <input
                type={fields.valueType === 'url' ? 'url' : 'text'}
                dir={fields.valueDir}
                value={values.value}
                onChange={(e) => setValues((v) => ({ ...v, value: e.target.value }))}
                placeholder={fields.valuePlaceholder}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--field-background)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          ) : null}

          {fields.helpText ? (
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{fields.helpText}</p>
          ) : null}

          {error ? (
            <p className="text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[var(--border)]/70 px-5 py-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : 'إضافة الرابط'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)]"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
