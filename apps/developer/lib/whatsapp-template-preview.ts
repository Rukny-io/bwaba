type TemplateComponent = {
  type?: string;
  text?: string;
  format?: string;
};

export function templateComponentsPreview(components: unknown): {
  header?: string;
  body?: string;
  footer?: string;
} {
  if (!Array.isArray(components)) return {};

  let header: string | undefined;
  let body: string | undefined;
  let footer: string | undefined;

  for (const item of components) {
    if (!item || typeof item !== 'object') continue;
    const comp = item as TemplateComponent;
    const type = comp.type?.toUpperCase();
    const text = comp.text?.trim();
    if (!text) continue;
    if (type === 'HEADER') header = text;
    if (type === 'BODY') body = text;
    if (type === 'FOOTER') footer = text;
  }

  return { header, body, footer };
}
