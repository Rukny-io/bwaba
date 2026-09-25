'use client';

import { useMemo, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import { FormThemeProvider } from '@/components/forms/form-theme-provider';
import { FormPreviewField } from '@/components/forms/form-preview-field';
import type { FormField } from '@/lib/forms-types';
import { resolveFieldVisibility } from '@/lib/conditional-logic-eval';
import {
  isPublicInputFieldType,
  PUBLIC_FORM_LAYOUT_TYPES,
} from '@rukny/forms-shared/public-form-utils';
import { parseFormTheme, getFormSubmitLabel, type FormTheme } from '@/lib/form-theme';
import { cn } from '@/lib/utils';
import { PublicFormBrand } from '@/components/public-form/public-form-brand';
import { FormButton } from '@/components/public-form/ui';
import { PublicFormStepNav } from '@/components/public-form/public-form-step-progress';

export interface PublicFormViewProps {
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  theme: FormTheme | Record<string, unknown> | null | undefined;
  fields: FormField[];
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  showQuestionNumbers?: boolean;
  preview?: boolean;
  previewNote?: string;
  submitLabel?: string;
  showBranding?: boolean;
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  beforeSubmit?: ReactNode;
  footer?: ReactNode;
  className?: string;
  embed?: boolean;
  slug?: string;
  activeFieldIds?: Set<string> | null;
  stepHeader?: ReactNode;
  fieldErrors?: Record<string, string>;
  emailVerified?: Record<string, boolean>;
  phoneVerified?: Record<string, boolean>;
  onEmailVerifiedChange?: (fieldId: string, verified: boolean) => void;
  onPhoneVerifiedChange?: (fieldId: string, verified: boolean) => void;
  multiStepNav?: {
    canGoBack: boolean;
    isLastStep: boolean;
    onBack: () => void;
    onNext: () => void;
  };
}

/** Respondent-facing form layout — matches `/f/{slug}` */
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
  isSubmitting = false,
  submitError = null,
  onSubmit,
  beforeSubmit,
  footer,
  className,
  embed = false,
  slug,
  activeFieldIds = null,
  stepHeader,
  fieldErrors = {},
  emailVerified = {},
  phoneVerified = {},
  onEmailVerifiedChange,
  onPhoneVerifiedChange,
  multiStepNav,
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

  const visibleIds = useMemo(() => {
    const base = new Set(visibility.visibleFieldIds);
    if (!activeFieldIds) return base;
    return new Set([...base].filter((id) => activeFieldIds.has(id)));
  }, [visibility.visibleFieldIds, activeFieldIds]);

  const requiredIds = useMemo(
    () => new Set(visibility.requiredFieldIds),
    [visibility.requiredFieldIds],
  );

  const inputFields = sortedFields.filter(
    (f) => isPublicInputFieldType(f.type) && visibleIds.has(f.id),
  );

  const displayTitle = title.trim() || 'نموذج بدون عنوان';
  const hasCover = Boolean(coverUrl?.trim()) && !stepHeader;

  let questionIndex = 0;

  const fieldsBlock = (
    <>
      {sortedFields.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--form-text-body)' }}>
          لا توجد حقول في هذا النموذج.
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
              slug={slug}
              fieldError={fieldErrors[field.id] ?? null}
              emailVerified={emailVerified[field.id] ?? false}
              phoneVerified={phoneVerified[field.id] ?? false}
              onEmailVerifiedChange={(verified) =>
                onEmailVerifiedChange?.(field.id, verified)
              }
              onPhoneVerifiedChange={(verified) =>
                onPhoneVerifiedChange?.(field.id, verified)
              }
            />
          );
        })
      )}

      {inputFields.length > 0 ? (
        <div className="public-form-submit-row">
          {submitError ? (
            <p className="public-form-field-error mb-3 w-full text-sm" role="alert">
              {submitError}
            </p>
          ) : null}
          {multiStepNav ? (
            <>
              {multiStepNav.isLastStep ? beforeSubmit : null}
              <PublicFormStepNav
                canGoBack={multiStepNav.canGoBack}
                isLastStep={multiStepNav.isLastStep}
                isSubmitting={isSubmitting}
                submitLabel={resolvedSubmitLabel}
                onBack={multiStepNav.onBack}
                onNext={multiStepNav.onNext}
              />
            </>
          ) : (
            <>
              {beforeSubmit}
              <FormButton
                type={preview ? 'button' : 'submit'}
                variant="primary"
                isDisabled={preview || isSubmitting}
                className="public-form-submit public-form-submit--themed w-full sm:w-auto"
              >
                {preview
                  ? `${resolvedSubmitLabel} (بعد النشر)`
                  : isSubmitting
                    ? 'جاري الإرسال…'
                    : resolvedSubmitLabel}
              </FormButton>
            </>
          )}
        </div>
      ) : null}
    </>
  );

  return (
    <FormThemeProvider
      theme={theme}
      className={cn('form-themed form-themed--wayl', embed ? 'min-h-0' : 'min-h-dvh')}
    >
      <div className={cn('public-form-page public-form-page--wayl', className)}>
        <div
          className={cn(
            'public-form-shell mx-auto',
            embed
              ? 'px-3 py-3 pb-4 sm:px-4'
              : 'px-4 py-8 pb-24 sm:px-6 sm:py-12 sm:pb-28',
          )}
          style={{ maxWidth: 'var(--form-max-width)' }}
        >
          {hasCover ? (
            <div className="public-form-cover-hero mb-8 sm:mb-10">
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

          <header
            className={cn(
              'public-form-header',
              embed ? 'mb-5 sm:mb-6' : stepHeader ? 'mb-4 sm:mb-5' : 'mb-8 sm:mb-10',
            )}
          >
            {!stepHeader ? (
              <>
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
              </>
            ) : null}

            {preview && previewNote ? (
              <p className="public-form-preview-note mt-4">{previewNote}</p>
            ) : null}
          </header>

          {stepHeader}

          <div className="public-form-body">
            {preview || !onSubmit ? (
              <div className="public-form-fields">{fieldsBlock}</div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="public-form-fields">
                {fieldsBlock}
              </form>
            )}
          </div>

          {footer}
        </div>
      </div>

      {showBranding ? <PublicFormBrand /> : null}
    </FormThemeProvider>
  );
}
