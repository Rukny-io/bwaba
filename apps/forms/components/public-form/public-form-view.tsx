'use client';

import { useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import { FormThemeProvider } from '@/components/forms/theme/form-theme-provider';
import { FormPreviewField } from '@/components/forms/preview/form-preview-field';
import type { FormField } from '@/lib/forms-api';
import { resolveFieldVisibility } from '@/lib/conditional-logic-eval';
import {
  isPublicInputFieldType,
  PUBLIC_FORM_LAYOUT_TYPES,
} from '@rukny/forms-shared/public-form-utils';
import { parseFormTheme, getFormSubmitLabel, type FormTheme } from '@/lib/form-theme';
import { cn } from '@/lib/utils';
import { PublicFormBrand } from '@/components/public-form/public-form-brand';

export interface PublicFormViewProps {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  theme: FormTheme | Record<string, unknown> | null | undefined;
  fields: FormField[];
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  showQuestionNumbers?: boolean;
  /** معاينة — زر الإرسال معطّل */
  preview?: boolean;
  previewNote?: string;
  submitLabel?: string;
  showBranding?: boolean;
  footer?: ReactNode;
  className?: string;
}

/** عرض النموذج بنفس هيكل الرابط العام `/f/{slug}` */
export function PublicFormView({
  title,
  description,
  coverUrl,
  theme: rawTheme,
  fields,
  values,
  onFieldChange,
  showQuestionNumbers = false,
  preview = false,
  previewNote,
  submitLabel,
  showBranding = false,
  footer,
  className,
}: PublicFormViewProps) {
  const theme = useMemo(() => parseFormTheme(rawTheme), [rawTheme]);
  const resolvedSubmitLabel = submitLabel ?? getFormSubmitLabel(theme);
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  );

  const visibility = useMemo(
    () =>
      resolveFieldVisibility(
        sortedFields.map((field) => ({
          id: field.id,
          conditionalLogic: field.conditionalLogic,
          required: Boolean(field.required),
        })),
        values,
      ),
    [sortedFields, values],
  );

  const visibleIds = useMemo(
    () => new Set(visibility.visibleFieldIds),
    [visibility.visibleFieldIds],
  );
  const requiredIds = useMemo(
    () => new Set(visibility.requiredFieldIds),
    [visibility.requiredFieldIds],
  );

  const inputFields = sortedFields.filter(
    (f) => isPublicInputFieldType(f.type) && visibleIds.has(f.id),
  );
  const displayTitle = title.trim() || 'نموذج بدون عنوان';
  const hasCover = Boolean(coverUrl?.trim());

  let questionIndex = 0;

  return (
    <FormThemeProvider
      theme={theme}
      className="form-themed form-themed--wayl min-h-dvh"
    >
      <div className={cn('public-form-page public-form-page--wayl', className)}>
        <div
          className="public-form-shell mx-auto px-4 py-10 pb-20 sm:px-6 sm:py-14 sm:pb-24"
          style={{ maxWidth: 'var(--form-max-width)' }}
        >
          {hasCover ? (
            <div
              className={cn(
                'public-form-cover-hero mb-8 sm:mb-10',
                preview && 'public-form-cover-hero--preview',
              )}
            >
              <div className="public-form-cover-hero__frame">
                <Image
                  src={coverUrl!}
                  alt=""
                  width={1200}
                  height={480}
                  className="public-form-cover-hero__image"
                  priority
                  unoptimized
                />
              </div>
            </div>
          ) : null}

          <header className="public-form-header mb-10 sm:mb-12">
            <h1
              className="public-form-title"
              style={{ color: 'var(--form-text-heading)' }}
            >
              {displayTitle}
            </h1>

            {description?.trim() ? (
              <p
                className="public-form-description mt-3 max-w-2xl"
                style={{ color: 'var(--form-text-body)' }}
              >
                {description.trim()}
              </p>
            ) : null}

            {preview && previewNote ? (
              <p className="public-form-preview-note mt-4">{previewNote}</p>
            ) : null}
          </header>

          <div className="public-form-body">
            <div className="public-form-fields">
              {sortedFields.length === 0 ? (
                <p
                  className="text-sm"
                  style={{ color: 'var(--form-text-body)' }}
                >
                  لا توجد حقول للمعاينة بعد.
                </p>
              ) : (
                sortedFields.map((field) => {
                  if (field.type === 'RESPONDENT_COUNTRY') return null;
                  if (!visibleIds.has(field.id)) return null;

                  const showNum =
                    showQuestionNumbers &&
                    isPublicInputFieldType(field.type) &&
                    !PUBLIC_FORM_LAYOUT_TYPES.has(field.type);
                  const idx = showNum ? ++questionIndex : undefined;
                  const effectiveField = {
                    ...field,
                    required: requiredIds.has(field.id),
                  };

                  return (
                    <FormPreviewField
                      key={field.id}
                      field={effectiveField}
                      value={values[field.id]}
                      onChange={(v) => onFieldChange(field.id, v)}
                      index={idx}
                      themed
                    />
                  );
                })
              )}

              {inputFields.length > 0 ? (
                <div className="public-form-submit-row">
                  <button
                    type="button"
                    disabled={preview}
                    className="public-form-submit public-form-submit--themed inline-flex items-center justify-center gap-2"
                  >
                    {preview ? `${resolvedSubmitLabel} (بعد النشر)` : resolvedSubmitLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {footer}
        </div>
      </div>

      {showBranding ? <PublicFormBrand /> : null}
    </FormThemeProvider>
  );
}
