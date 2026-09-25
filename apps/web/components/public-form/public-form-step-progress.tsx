'use client';

import { cn } from '@/lib/utils';
import { FormButton, FormProgressBar } from '@/components/public-form/ui';

export function PublicFormStepProgress({
  current,
  total,
  title,
  description,
  showBar,
}: {
  current: number;
  total: number;
  title?: string;
  description?: string | null;
  showBar?: boolean;
}) {
  const pct = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="public-form-step-progress mb-6 sm:mb-8">
      {showBar ? (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-[color:var(--form-text-label)]">
            <span>
              الخطوة {current + 1} من {total}
            </span>
            <span dir="ltr" lang="en">
              {pct}%
            </span>
          </div>
          <FormProgressBar value={pct} />
        </div>
      ) : (
        <p className="mb-2 text-xs font-medium text-[color:var(--form-text-label)]">
          الخطوة {current + 1} من {total}
        </p>
      )}

      {title ? (
        <h2 className="text-lg font-semibold text-[color:var(--form-text-heading)] sm:text-xl">
          {title}
        </h2>
      ) : null}
      {description?.trim() ? (
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--form-text-body)]">
          {description.trim()}
        </p>
      ) : null}
    </div>
  );
}

export function PublicFormStepNav({
  canGoBack,
  isLastStep,
  isSubmitting,
  submitLabel,
  onBack,
  onNext,
  className,
}: {
  canGoBack: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onBack: () => void;
  onNext: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'public-form-step-nav flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {canGoBack ? (
        <FormButton
          type="button"
          variant="secondary"
          onPress={onBack}
          className="w-full sm:w-auto"
        >
          السابق
        </FormButton>
      ) : (
        <span className="hidden sm:block" />
      )}

      <FormButton
        type={isLastStep ? 'submit' : 'button'}
        variant="primary"
        onPress={isLastStep ? undefined : onNext}
        isDisabled={isSubmitting}
        className="w-full min-w-[9rem] sm:w-auto"
      >
        {isSubmitting
          ? 'جاري الإرسال…'
          : isLastStep
            ? submitLabel
            : 'التالي'}
      </FormButton>
    </div>
  );
}
