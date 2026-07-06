import type { FormType } from '@/lib/forms-api';
import type { DraftFormField } from '@/lib/form-field-utils';

export type TemplateCategory =
  | 'business'
  | 'events'
  | 'customer'
  | 'hr'
  | 'education';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  business: 'أعمال',
  events: 'فعاليات',
  customer: 'عملاء',
  hr: 'موارد بشرية',
  education: 'تعليم',
};

export interface FormTemplateDefinition {
  id: string;
  title: string;
  description: string;
  formType: FormType;
  category: TemplateCategory;
  tags: string[];
  suggestedTitle: string;
  suggestedDescription?: string;
  estimatedMinutes?: number;
  featured?: boolean;
  popular?: boolean;
  buildFields: () => DraftFormField[];
}

export type TemplateTypeFilter = FormType | '';
