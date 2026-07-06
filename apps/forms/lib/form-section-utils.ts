import type { FormDetail, FormField, FormStepPayload } from '@/lib/forms-api';
import type { DraftFormField } from '@/lib/form-field-utils';
import { fieldsToPayload } from '@/lib/form-field-utils';

export interface FormSectionDraft {
  clientKey: string;
  title: string;
  description: string;
}

export function newSectionKey(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function sectionsFromForm(form: FormDetail): FormSectionDraft[] {
  if (form.isMultiStep && form.steps?.length) {
    return [...form.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        clientKey: s.id,
        title: s.title,
        description: s.description ?? '',
      }));
  }
  return [
    {
      clientKey: `section-${form.id}`,
      title: 'القسم 1',
      description: '',
    },
  ];
}

export function fieldSectionAssignmentFromForm(
  form: FormDetail,
  sections: FormSectionDraft[],
): Record<string, string> {
  const map: Record<string, string> = {};
  const defaultKey = sections[0]?.clientKey ?? newSectionKey();

  if (form.isMultiStep && form.steps?.length) {
    for (const step of form.steps) {
      const key =
        sections.find((s) => s.clientKey === step.id)?.clientKey ?? defaultKey;
      const stepFields = step.form_fields ?? step.fields ?? [];
      for (const f of stepFields) {
        map[f.id] = key;
      }
    }
  }

  for (const f of form.fields ?? []) {
    if (!map[f.id]) {
      map[f.id] = defaultKey;
    }
  }

  return map;
}

export function fieldsGroupedBySection(
  fields: DraftFormField[],
  sections: FormSectionDraft[],
  assignment: Record<string, string>,
): Map<string, DraftFormField[]> {
  const groups = new Map<string, DraftFormField[]>();
  for (const section of sections) {
    groups.set(section.clientKey, []);
  }

  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const defaultKey = sections[0]?.clientKey;

  for (const field of sorted) {
    const key = assignment[field.clientId] ?? defaultKey;
    if (!key || !groups.has(key)) continue;
    groups.get(key)!.push(field);
  }

  return groups;
}

export function flattenFieldsBySections(
  sections: FormSectionDraft[],
  grouped: Map<string, DraftFormField[]>,
): DraftFormField[] {
  const next: DraftFormField[] = [];
  let order = 0;

  for (const section of sections) {
    const sectionFields = grouped.get(section.clientKey) ?? [];
    for (const field of sectionFields) {
      next.push({ ...field, order });
      order += 1;
    }
  }

  return next;
}

export function moveFieldBetweenSections(
  fields: DraftFormField[],
  sections: FormSectionDraft[],
  assignment: Record<string, string>,
  fieldId: string,
  targetSectionKey: string,
  targetIndex?: number,
): { fields: DraftFormField[]; assignment: Record<string, string> } {
  const grouped = fieldsGroupedBySection(fields, sections, assignment);
  let moving: DraftFormField | undefined;

  for (const [key, list] of grouped.entries()) {
    const idx = list.findIndex((f) => f.clientId === fieldId);
    if (idx >= 0) {
      moving = list[idx];
      list.splice(idx, 1);
      grouped.set(key, list);
      break;
    }
  }

  if (!moving) {
    return { fields, assignment };
  }

  const targetList = [...(grouped.get(targetSectionKey) ?? [])];
  const insertAt =
    targetIndex == null
      ? targetList.length
      : Math.max(0, Math.min(targetIndex, targetList.length));
  targetList.splice(insertAt, 0, moving);
  grouped.set(targetSectionKey, targetList);

  const nextAssignment = { ...assignment, [fieldId]: targetSectionKey };
  return {
    fields: flattenFieldsBySections(sections, grouped),
    assignment: nextAssignment,
  };
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

export function buildStepsPayload(
  sections: FormSectionDraft[],
  fields: DraftFormField[],
  assignment: Record<string, string>,
): FormStepPayload[] {
  const apiFields = fieldsToPayload(fields);
  const fieldById = new Map(apiFields.map((f) => [f.id!, f]));

  return sections.map((section, sectionIndex) => {
    const sectionFields = fields
      .filter((f) => (assignment[f.clientId] ?? sections[0]?.clientKey) === section.clientKey)
      .sort((a, b) => a.order - b.order);

    return {
      title: section.title.trim() || `القسم ${sectionIndex + 1}`,
      description: section.description.trim() || undefined,
      order: sectionIndex,
      fields: sectionFields
        .map((f) => fieldById.get(f.clientId))
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .map((f, i) => fieldToStepPayload(f as FormField, i)),
    };
  });
}

export function isMultiSectionForm(sections: FormSectionDraft[]): boolean {
  return sections.length > 1;
}
