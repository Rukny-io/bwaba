import type { FormField, FormStep, PublicForm } from '@/lib/forms-types';

export function getStepFieldIds(step: FormStep): string[] {
  const list = step.form_fields ?? step.fields ?? [];
  return [...list].sort((a, b) => a.order - b.order).map((f) => f.id);
}

export function resolveMultiStepPlan(
  form: PublicForm,
): { steps: FormStep[]; fieldIdsByStep: string[][] } | null {
  if (!form.isMultiStep || !form.steps?.length) return null;

  const steps = [...form.steps].sort((a, b) => a.order - b.order);
  const fieldIdsByStep = steps.map(getStepFieldIds);
  const assigned = new Set(fieldIdsByStep.flat());

  const unassigned = (form.fields ?? [])
    .filter((f) => !assigned.has(f.id))
    .sort((a, b) => a.order - b.order)
    .map((f) => f.id);

  if (unassigned.length > 0 && fieldIdsByStep.length > 0) {
    fieldIdsByStep[0] = [...unassigned, ...fieldIdsByStep[0]];
  }

  return { steps, fieldIdsByStep };
}

export function fieldsForStep(
  allFields: FormField[],
  fieldIds: string[],
): FormField[] {
  const order = new Map(fieldIds.map((id, index) => [id, index]));
  return allFields
    .filter((f) => order.has(f.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
