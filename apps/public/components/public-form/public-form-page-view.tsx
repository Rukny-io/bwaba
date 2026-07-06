'use client';

import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import { PublicFormView } from '@/components/public-form/public-form-view';
import { PublicFormViewTracker } from '@/components/public-form/public-form-view-tracker';
import { PublicFormStepProgress } from '@/components/public-form/public-form-step-progress';
import {
  TurnstileWidget,
  formNeedsTurnstile,
  getTurnstileSiteKey,
} from '@/components/turnstile/turnstile-widget';
import type { PublicForm } from '@/lib/forms-types';
import {
  formUnavailableMessage,
  isFormAvailable,
  submitPublicForm,
} from '@/lib/public-form-api';
import {
  notifyFormEmbedSubmitted,
  useFormEmbedMessaging,
} from '@/components/public-form/form-embed-messaging';
import { PublicFormStatusCard } from '@/components/public-form/public-form-status-card';
import { resolveFieldVisibility } from '@/lib/conditional-logic-eval';
import { resolveMultiStepPlan } from '@/lib/public-form-steps';
import {
  firstErrorFieldId,
  validateVisibleFields,
} from '@/lib/public-form-validation';

interface PublicFormPageViewProps {
  form: PublicForm;
  slug: string;
  embed?: boolean;
}

export function PublicFormPageView({ form, slug, embed = false }: PublicFormPageViewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [emailVerified, setEmailVerified] = useState<Record<string, boolean>>({});
  const [phoneVerified, setPhoneVerified] = useState<Record<string, boolean>>({});
  const startedAt = useRef(Date.now());

  useFormEmbedMessaging(slug, embed);

  const sortedFields = useMemo(
    () => [...(form.fields ?? [])].sort((a, b) => a.order - b.order),
    [form.fields],
  );

  const multiStepPlan = useMemo(() => resolveMultiStepPlan(form), [form]);
  const isMultiStep = Boolean(multiStepPlan);
  const totalSteps = multiStepPlan?.steps.length ?? 1;
  const isLastStep = !isMultiStep || currentStep >= totalSteps - 1;

  const activeFieldIds = useMemo(() => {
    if (!multiStepPlan) return null;
    return new Set(multiStepPlan.fieldIdsByStep[currentStep] ?? []);
  }, [multiStepPlan, currentStep]);

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

  const needsTurnstile = useMemo(() => formNeedsTurnstile(form), [form]);
  const turnstileSiteKey = getTurnstileSiteKey();
  const available = isFormAvailable(form);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    setTurnstileResetKey((key) => key + 1);
  }, []);

  function validateCurrentStep(): boolean {
    const errors = validateVisibleFields(sortedFields, values, visibleIds, {
      emailVerified,
      phoneVerified,
    });
    setFieldErrors(errors);
    const firstId = firstErrorFieldId(errors);
    if (firstId) {
      document.getElementById(firstId)?.focus();
      return false;
    }
    return true;
  }

  function handleNextStep() {
    setSubmitError(null);
    if (!validateCurrentStep()) return;
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePrevStep() {
    setFieldErrors({});
    setSubmitError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || isSubmitting) return;

    if (!validateCurrentStep()) return;

    if (needsTurnstile && !turnstileToken) {
      setSubmitError('أكمل التحقق الأمني قبل الإرسال.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const result = await submitPublicForm(slug, {
      data: values,
      timeToComplete: Math.round((Date.now() - startedAt.current) / 1000),
      turnstileToken: turnstileToken ?? undefined,
    });

    setIsSubmitting(false);

    if (result.ok) {
      setSubmitted(true);
      notifyFormEmbedSubmitted(slug, embed);
      return;
    }

    if (
      result.code === 'TURNSTILE_FAILED' ||
      result.code === 'TURNSTILE_REQUIRED'
    ) {
      resetTurnstile();
    }

    setSubmitError(result.message);
  }

  const turnstileBlock =
    needsTurnstile && turnstileSiteKey ? (
      <div className="mb-4 flex w-full justify-center">
        <TurnstileWidget
          siteKey={turnstileSiteKey}
          resetKey={turnstileResetKey}
          onVerify={setTurnstileToken}
          onExpire={resetTurnstile}
          onError={resetTurnstile}
        />
      </div>
    ) : needsTurnstile && !turnstileSiteKey ? (
      <p className="mb-4 w-full text-center text-xs text-[var(--muted-foreground,#64748b)]">
        التحقق الأمني غير مهيّأ على الخادم.
      </p>
    ) : null;

  if (submitted) {
    const thankTitle = form.thankYouTitle?.trim() || 'شكراً لمشاركتك';
    const thankMessage =
      form.thankYouMessage?.trim() || 'تم استلام إجابتك بنجاح.';

    return (
      <PublicFormStatusCard
        variant="success"
        title={thankTitle}
        message={thankMessage}
        embed={embed}
      />
    );
  }

  if (!available) {
    return (
      <PublicFormStatusCard
        variant="unavailable"
        title="النموذج غير متاح"
        message={formUnavailableMessage(form)}
        embed={embed}
      />
    );
  }

  const currentStepMeta = multiStepPlan?.steps[currentStep];

  return (
    <>
      <PublicFormViewTracker slug={slug} />
      <div className={embed ? 'overflow-hidden' : undefined}>
        <PublicFormView
          title={form.title}
          description={form.description}
          coverUrl={form.coverImage ?? null}
          theme={form.theme}
          fields={sortedFields}
          values={values}
          onFieldChange={(fieldId, value) => {
            setValues((prev) => ({ ...prev, [fieldId]: value }));
            setFieldErrors((prev) => {
              if (!prev[fieldId]) return prev;
              const next = { ...prev };
              delete next[fieldId];
              return next;
            });
          }}
          showQuestionNumbers={!isMultiStep}
          preview={false}
          embed={embed}
          isSubmitting={isSubmitting}
          submitError={submitError}
          beforeSubmit={turnstileBlock}
          onSubmit={(e) => void handleSubmit(e)}
          showBranding={embed ? false : (form.showBranding ?? false)}
          slug={slug}
          activeFieldIds={activeFieldIds}
          fieldErrors={fieldErrors}
          emailVerified={emailVerified}
          phoneVerified={phoneVerified}
          onEmailVerifiedChange={(fieldId, verified) =>
            setEmailVerified((prev) => ({ ...prev, [fieldId]: verified }))
          }
          onPhoneVerifiedChange={(fieldId, verified) =>
            setPhoneVerified((prev) => ({ ...prev, [fieldId]: verified }))
          }
          stepHeader={
            isMultiStep && currentStepMeta ? (
              <PublicFormStepProgress
                current={currentStep}
                total={totalSteps}
                title={currentStepMeta.title}
                description={currentStepMeta.description}
                showBar={form.showProgressBar ?? true}
              />
            ) : undefined
          }
          multiStepNav={
            isMultiStep
              ? {
                  canGoBack: currentStep > 0,
                  isLastStep,
                  onBack: handlePrevStep,
                  onNext: handleNextStep,
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
