'use client';

import { useState } from 'react';
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import {
  buildCreatePayloadFromTemplate,
  getFormLinkTemplate,
} from '@/lib/forms/form-link-templates';
import { createForm, publishForm, type FormListItem } from '@/lib/forms/forms-api';
import { getFormEditorUrl, getPublicFormUrl } from '@/lib/forms/public-url';
import type { CreateSocialLinkInput } from '@/lib/links/types';

interface FormLinkSetupProps {
  onBack: () => void;
  onSubmit: (payload: CreateSocialLinkInput) => Promise<void>;
  templateId?: string | null;
  existingForm?: FormListItem | null;
}

export function FormLinkSetup({
  onBack,
  onSubmit,
  templateId: initialTemplateId = null,
  existingForm: initialForm = null,
}: FormLinkSetupProps) {
  const initialTemplate = initialTemplateId ? getFormLinkTemplate(initialTemplateId) : null;
  const [templateId] = useState(initialTemplateId);
  const [selectedForm] = useState(initialForm);
  const [linkTitle, setLinkTitle] = useState(
    initialForm?.title ?? initialTemplate?.suggestedTitle ?? '',
  );
  const [formTitle, setFormTitle] = useState(
    initialForm?.title ?? initialTemplate?.suggestedTitle ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = linkTitle.trim();
    if (!title) {
      setError('أدخل عنواناً للرابط');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let slug: string;

      if (selectedForm) {
        slug = selectedForm.slug;
      } else {
        const template = templateId ? getFormLinkTemplate(templateId) : null;
        if (!template) {
          setError('اختر قالباً أو نموذجاً');
          return;
        }
        const payload = buildCreatePayloadFromTemplate(template, formTitle.trim() || undefined);
        const created = await createForm(payload);
        if (created.status !== 'PUBLISHED') {
          await publishForm(created.id);
        }
        slug = created.slug;
      }

      await onSubmit({
        platform: 'form',
        username: slug,
        url: getPublicFormUrl(slug),
        title,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إضافة النموذج');
    } finally {
      setSaving(false);
    }
  }

  const editorSlug = selectedForm?.slug;
  const templateName = initialTemplate?.title ?? selectedForm?.title ?? 'نموذج';

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
          <LinkPlatformIconBadge type="form" size="sm" />
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--foreground)]">{templateName}</h3>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              خصّص العنوان وأضفه لصفحتك
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              عنوان الرابط في صفحتك
            </label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="مثال: تواصل معنا"
              className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--field-background)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {!selectedForm && templateId ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">عنوان النموذج</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="عنوان يظهر للزائر"
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--field-background)] px-4 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />
              <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                يمكنك تخصيص الحقول والتصميم لاحقاً من محرّر النماذج بعد الإضافة.
              </p>
            </div>
          ) : null}

          {editorSlug ? (
            <a
              href={getFormEditorUrl(editorSlug)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)] hover:underline"
            >
              تخصيص النموذج في المحرّر
              <ExternalLink className="size-3.5" />
            </a>
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
          {saving ? <Loader2 className="size-4 animate-spin" /> : 'إضافة للملف الشخصي'}
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
