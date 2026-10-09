import type { WhatsappLibraryTemplate } from '@/lib/api/types';

export function fillLibraryBodyPreview(
  body: string | undefined,
  params?: string[],
): string {
  if (!body) return '';
  return body.replace(/\{\{(\d+)\}\}/g, (_, index: string) => {
    const i = Number.parseInt(index, 10) - 1;
    const sample = params?.[i];
    return sample?.trim() ? sample : `{{${index}}}`;
  });
}

export function defaultLibraryTemplateName(libraryName: string): string {
  const base = libraryName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 480);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base || 'template'}_${suffix}`;
}

export function libraryTemplateNeedsButtonInputs(
  template: WhatsappLibraryTemplate,
): boolean {
  return (
    template.buttons?.some((btn) =>
      ['URL', 'PHONE_NUMBER', 'OTP', 'FLOW'].includes(btn.type),
    ) ?? false
  );
}

export function buildDefaultLibraryButtonInputs(
  template: WhatsappLibraryTemplate,
): unknown[] {
  if (!template.buttons?.length) return [];

  return template.buttons
    .map((btn) => {
      if (btn.type === 'URL') {
        const base =
          btn.url && btn.url.includes('{{')
            ? btn.url
            : `${btn.url || 'https://example.com/'}{{1}}`;
        return {
          type: 'URL',
          url: {
            base_url: base,
            url_suffix_example: btn.url || 'https://example.com/demo',
          },
        };
      }
      if (btn.type === 'PHONE_NUMBER') {
        return {
          type: 'PHONE_NUMBER',
          phone_number: btn.phone_number || '+9640000000000',
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}
