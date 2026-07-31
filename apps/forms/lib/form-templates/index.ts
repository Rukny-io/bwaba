import type { FormType } from '@/lib/forms-api';
import {
  fieldsToPayload,
  newClientFieldId,
  normalizeFieldOrders,
  type DraftFormField,
} from '@/lib/form-field-utils';
import { FORM_TEMPLATES_CATALOG } from '@/lib/form-templates/catalog';
import { legacyFieldsForFormType } from '@/lib/form-templates/fields';
import type {
  FormTemplateDefinition,
  TemplateCategory,
  TemplateTypeFilter,
} from '@/lib/form-templates/types';

export type {
  FormTemplateDefinition,
  TemplateCategory,
  TemplateTypeFilter,
} from '@/lib/form-templates/types';
export { TEMPLATE_CATEGORY_LABELS } from '@/lib/form-templates/types';

export function getAllTemplates(): FormTemplateDefinition[] {
  return FORM_TEMPLATES_CATALOG;
}

export function getTemplateById(id: string): FormTemplateDefinition | undefined {
  return FORM_TEMPLATES_CATALOG.find((t) => t.id === id);
}

export function getFeaturedTemplates(): FormTemplateDefinition[] {
  return FORM_TEMPLATES_CATALOG.filter((t) => t.featured);
}

export function resolveTemplateFields(
  template: FormTemplateDefinition,
): DraftFormField[] {
  return normalizeFieldOrders(
    template.buildFields().map((field) => ({
      ...field,
      clientId: newClientFieldId(),
      options: [...field.options],
    })),
  );
}

export function getTemplateFieldCount(template: FormTemplateDefinition): number {
  return template.buildFields().length;
}

/** Backward compat — wizard «استبدال بالقالب» */
export function getFormTemplateFields(formType: FormType): DraftFormField[] {
  return normalizeFieldOrders(
    legacyFieldsForFormType(formType).map((field) => ({
      ...field,
      clientId: newClientFieldId(),
      options: [...field.options],
    })),
  );
}

export interface TemplateFilterOptions {
  query?: string;
  formType?: TemplateTypeFilter;
  category?: TemplateCategory | '';
  featuredOnly?: boolean;
}

export function filterTemplates(
  options: TemplateFilterOptions,
): FormTemplateDefinition[] {
  const q = options.query?.trim().toLowerCase() ?? '';

  return FORM_TEMPLATES_CATALOG.filter((template) => {
    if (options.featuredOnly && !template.featured) return false;
    if (options.formType && template.formType !== options.formType) return false;
    if (options.category && template.category !== options.category) return false;

    if (!q) return true;

    const haystack = [
      template.title,
      template.description,
      template.suggestedTitle,
      ...template.tags,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function templateFieldsToCreatePayload(
  template: FormTemplateDefinition,
): ReturnType<typeof fieldsToPayload> {
  return fieldsToPayload(resolveTemplateFields(template));
}

export function buildCreateFormPayloadFromTemplate(
  template: FormTemplateDefinition,
) {
  return {
    title: template.suggestedTitle,
    description: template.suggestedDescription,
    type: template.formType,
    status: 'DRAFT' as const,
    fields: templateFieldsToCreatePayload(template),
  };
}
