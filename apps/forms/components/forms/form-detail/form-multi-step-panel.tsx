'use client';

import { useEffect, useMemo, useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { Button, Switch } from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import { appToast } from '@/lib/app-toast';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import {
  getForm,
  updateForm,
  updateFormSteps,
  type FormDetail,
  type FormField,
  type FormStepPayload,
} from '@/lib/forms-api';
import { PlanFeatureGate } from '@/components/plan/plan-feature-gate';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

interface StepDraft {
  clientKey: string;
  title: string;
  description: string;
}

function newStepKey(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function fieldToStepPayload(field: FormField, order: number) {
  return {
    id: field.id,
    label: field.label,
    type: field.type,
    order,
    required: field.required,
    placeholder: field.placeholder ?? undefined,
    description: field.description ?? undefined,
    options: field.options,
    minValue: field.minValue ?? undefined,
    maxValue: field.maxValue ?? undefined,
    minLabel: field.minLabel ?? undefined,
    maxLabel: field.maxLabel ?? undefined,
    conditionalLogic: (field as FormField & { conditionalLogic?: unknown })
      .conditionalLogic,
    validationRules: (field as FormField & { validationRules?: unknown })
      .validationRules,
  };
}

function stepsFromForm(form: FormDetail): StepDraft[] {
  if (form.isMultiStep && form.steps?.length) {
    return [...form.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        clientKey: s.id,
        title: s.title,
        description: s.description ?? '',
      }));
  }
  return [{ clientKey: newStepKey(), title: 'الخطوة 1', description: '' }];
}

function assignmentFromForm(form: FormDetail, stepKeys: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const fields = form.fields ?? [];

  if (form.isMultiStep && form.steps?.length) {
    for (const step of form.steps) {
      const key = stepKeys.find((k) => k === step.id) ?? stepKeys[0];
      const stepFields = step.form_fields ?? step.fields ?? [];
      for (const f of stepFields) {
        map[f.id] = key;
      }
    }
  }

  for (const f of fields) {
    if (!map[f.id]) {
      map[f.id] = stepKeys[0];
    }
  }
  return map;
}

export function FormMultiStepPanel({
  form,
  fields: fieldsOverride,
  onSaved,
  onBeforeSave,
}: {
  form: FormDetail;
  /** حقول حية من المحرّر (قبل مزامنة الخادم) */
  fields?: FormField[];
  onSaved: (next: FormDetail) => void;
  onBeforeSave?: () => Promise<void>;
}) {
  const [isMultiStep, setIsMultiStep] = useState(Boolean(form.isMultiStep));
  const [showProgressBar, setShowProgressBar] = useState(
    form.showProgressBar !== false,
  );
  const [steps, setSteps] = useState<StepDraft[]>(() => stepsFromForm(form));
  const [fieldAssignment, setFieldAssignment] = useState<Record<string, string>>(
    () => {
      const initialSteps = stepsFromForm(form);
      return assignmentFromForm(form, initialSteps.map((s) => s.clientKey));
    },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = useMemo(
    () =>
      [...(fieldsOverride ?? form.fields ?? [])].sort(
        (a, b) => a.order - b.order,
      ),
    [fieldsOverride, form.fields],
  );

  useEffect(() => {
    const nextSteps = stepsFromForm(form);
    setIsMultiStep(Boolean(form.isMultiStep));
    setShowProgressBar(form.showProgressBar !== false);
    setSteps(nextSteps);
    setFieldAssignment(
      assignmentFromForm(form, nextSteps.map((s) => s.clientKey)),
    );
  }, [form]);

  function addStep() {
    const n = steps.length + 1;
    const key = newStepKey();
    setSteps((prev) => [
      ...prev,
      { clientKey: key, title: `الخطوة ${n}`, description: '' },
    ]);
  }

  function removeStep(clientKey: string) {
    if (steps.length <= 1) return;
    const fallback = steps.find((s) => s.clientKey !== clientKey)?.clientKey;
    if (!fallback) return;
    setSteps((prev) => prev.filter((s) => s.clientKey !== clientKey));
    setFieldAssignment((prev) => {
      const next = { ...prev };
      for (const [fieldId, stepKey] of Object.entries(next)) {
        if (stepKey === clientKey) next[fieldId] = fallback;
      }
      return next;
    });
  }

  function buildStepPayload(): FormStepPayload[] {
    return steps.map((step, stepIndex) => {
      const stepFields = fields.filter(
        (f) => fieldAssignment[f.id] === step.clientKey,
      );
      return {
        title: step.title.trim() || `الخطوة ${stepIndex + 1}`,
        description: step.description.trim() || undefined,
        order: stepIndex,
        fields: stepFields.map((f, i) => fieldToStepPayload(f, i)),
      };
    });
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      if (onBeforeSave) {
        await onBeforeSave();
      }

      if (!isMultiStep) {
        await updateForm(form.id, {
          isMultiStep: false,
          showProgressBar: false,
          fields: fields.map((f, i) => fieldToStepPayload(f, i)),
        });
        onSaved(await getForm(form.id));
        appToast.success('تم إيقاف النموذج متعدد الخطوات');
        return;
      }

      const emptyStep = steps.some(
        (s) =>
          !fields.some((f) => fieldAssignment[f.id] === s.clientKey),
      );
      if (emptyStep && fields.length > 0) {
        const msg = 'كل خطوة يجب أن تحتوي على حقل واحد على الأقل';
        setError(msg);
        appToast.error(msg);
        return;
      }

      await updateForm(form.id, {
        isMultiStep: true,
        showProgressBar,
      });
      await updateFormSteps(form.id, buildStepPayload());
      onSaved(await getForm(form.id));
      appToast.success('تم حفظ الخطوات');
    } catch (e) {
      const msg =
        e instanceof ApiException
          ? e.message
          : 'تعذّر الحفظ — تأكد من أن خطتك تدعم النماذج متعددة الخطوات';
      setError(msg);
      appToast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSectionCard
      icon={Layers}
      title="الأقسام المتعددة"
      description="قسّم النموذج إلى أقسام من محرّر النموذج — زر «إضافة قسم» أسفل الحقول."
    >
      <PlanFeatureGate
        feature="multiStepForms"
        description="النماذج متعددة الخطوات متاحة في الخطط المدفوعة."
      >
      <div className="space-y-5">
        <DashboardSurface
          padding="sm"
          className="flex items-start justify-between gap-4 bg-[var(--surface-secondary)]/20"
        >
          <div>
            <p className="text-sm font-medium">نموذج متعدد الخطوات</p>
            <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
              يعرض حقولاً جزءاً في كل صفحة بدل صفحة واحدة.
            </p>
          </div>
          <Switch
            isSelected={isMultiStep}
            onChange={setIsMultiStep}
            aria-label="نموذج متعدد الخطوات"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </DashboardSurface>

        {isMultiStep ? (
          <>
            <DashboardSurface
              padding="sm"
              className="flex items-start justify-between gap-4 bg-[var(--surface-secondary)]/20"
            >
              <div>
                <p className="text-sm font-medium">شريط التقدم</p>
                <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                  يظهر للمستجيب نسبة إكمال الخطوات.
                </p>
              </div>
              <Switch
                isSelected={showProgressBar}
                onChange={setShowProgressBar}
                aria-label="شريط التقدم"
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </DashboardSurface>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">الخطوات</p>
                <Button
                  variant="tertiary"
                  size="sm"
                  className="rounded-xl"
                  onPress={addStep}
                >
                  <Plus className="size-4" />
                  إضافة خطوة
                </Button>
              </div>

              {steps.map((step, index) => (
                <DashboardSurface key={step.clientKey} padding="sm" className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">الخطوة {index + 1}</p>
                    {steps.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeStep(step.clientKey)}
                        className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
                        aria-label="حذف الخطوة"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                  <input
                    value={step.title}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s) =>
                          s.clientKey === step.clientKey
                            ? { ...s, title: e.target.value }
                            : s,
                        ),
                      )
                    }
                    className={cn(fieldInputClass, 'w-full px-3 py-2 text-sm')}
                    placeholder="عنوان الخطوة"
                  />
                  <textarea
                    value={step.description}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((s) =>
                          s.clientKey === step.clientKey
                            ? { ...s, description: e.target.value }
                            : s,
                        ),
                      )
                    }
                    rows={2}
                    className={cn(
                      fieldInputClass,
                      'w-full resize-none px-3 py-2 text-sm',
                    )}
                    placeholder="وصف اختياري"
                  />
                </DashboardSurface>
              ))}
            </div>

            {fields.length > 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                عدّل الأقسام وتوزيع الحقول من{' '}
                <span className="font-medium text-[var(--foreground)]">
                  محرّر النموذج
                </span>
                : أضف قسماً جديداً، ثم اسحب الحقول بين الأقسام بأيقونة النقل.
              </p>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)]">
                أضف حقولاً للنموذج أولاً من محرّر الحقول.
              </p>
            )}
          </>
        ) : null}

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        <Button variant="primary" isDisabled={busy} onPress={() => void handleSave()}>
          {busy ? 'جاري الحفظ…' : 'حفظ إعدادات الأقسام'}
        </Button>
      </div>
      </PlanFeatureGate>
    </SettingsSectionCard>
  );
}
