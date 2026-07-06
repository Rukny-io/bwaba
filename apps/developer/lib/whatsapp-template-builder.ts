export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';

export interface CreateTemplateFormState {
  name: string;
  language: string;
  category: TemplateCategory;
  header: string;
  body: string;
  footer: string;
  bodyExamples: Record<number, string>;
  quickReplyButtons: string[];
}

export const TEMPLATE_LANGUAGES = [
  { value: 'ar', labelKey: 'langAr' as const },
  { value: 'ar_IQ', labelKey: 'langArIq' as const },
  { value: 'ar_SA', labelKey: 'langArSa' as const },
  { value: 'en', labelKey: 'langEn' as const },
  { value: 'en_US', labelKey: 'langEnUs' as const },
] as const;

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'UTILITY',
  'MARKETING',
  'AUTHENTICATION',
];

export function normalizeTemplateName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 512);
}

export function extractTemplateVariables(text: string): number[] {
  const matches = text.matchAll(/\{\{(\d+)\}\}/g);
  const nums = new Set<number>();
  for (const match of matches) {
    nums.add(Number.parseInt(match[1], 10));
  }
  return [...nums].sort((a, b) => a - b);
}

export function buildTemplateComponents(form: CreateTemplateFormState): Record<string, unknown>[] {
  const components: Record<string, unknown>[] = [];

  const header = form.header.trim();
  if (header) {
    components.push({
      type: 'HEADER',
      format: 'TEXT',
      text: header,
    });
  }

  const bodyText = form.body.trim();
  const variables = extractTemplateVariables(bodyText);
  const body: Record<string, unknown> = {
    type: 'BODY',
    text: bodyText,
  };

  if (variables.length > 0) {
    body.example = {
      body_text: [variables.map((n) => form.bodyExamples[n]?.trim() || `sample_${n}`)],
    };
  }

  components.push(body);

  const footer = form.footer.trim();
  if (footer) {
    components.push({
      type: 'FOOTER',
      text: footer,
    });
  }

  const buttons = form.quickReplyButtons.map((t) => t.trim()).filter(Boolean).slice(0, 3);
  if (buttons.length > 0) {
    components.push({
      type: 'BUTTONS',
      buttons: buttons.map((text) => ({
        type: 'QUICK_REPLY',
        text: text.slice(0, 25),
      })),
    });
  }

  return components;
}

export function validateCreateTemplateForm(
  form: CreateTemplateFormState,
  messages: {
    nameRequired: string;
    nameInvalid: string;
    bodyRequired: string;
    examplesRequired: string;
  },
): string | null {
  const name = normalizeTemplateName(form.name);
  if (!name) return messages.nameRequired;
  if (!/^[a-z][a-z0-9_]*$/.test(name)) return messages.nameInvalid;

  if (!form.body.trim()) return messages.bodyRequired;

  const variables = extractTemplateVariables(form.body);
  for (const variable of variables) {
    if (!form.bodyExamples[variable]?.trim()) {
      return messages.examplesRequired;
    }
  }

  return null;
}

export const EMPTY_TEMPLATE_FORM: CreateTemplateFormState = {
  name: '',
  language: 'ar',
  category: 'UTILITY',
  header: '',
  body: '',
  footer: '',
  bodyExamples: {},
  quickReplyButtons: ['', ''],
};
