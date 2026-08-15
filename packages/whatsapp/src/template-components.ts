import type { TemplateComponent } from './types';

export function buildBodyComponents(variables: string[]): TemplateComponent[] {
  if (variables.length === 0) return [];
  return [
    {
      type: 'body',
      parameters: variables.map((text) => ({ type: 'text', text })),
    },
  ];
}

export function buildOtpComponents(
  code: string,
  includeCopyCodeButton = false,
): TemplateComponent[] {
  const components: TemplateComponent[] = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: code }],
    },
  ];

  if (includeCopyCodeButton) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: code }],
    });
  }

  return components;
}
