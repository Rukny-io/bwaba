type MessageTree = { [key: string]: string | MessageTree };

export function getMessage(
  messages: MessageTree,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const parts = path.split('.');
  let current: string | MessageTree | undefined = messages;

  for (const part of parts) {
    if (!current || typeof current === 'string') {
      current = undefined;
      break;
    }
    current = current[part];
  }

  if (typeof current !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[i18n] Missing message: ${path}`);
    }
    return path;
  }

  if (!vars) return current;

  return current.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? `{${key}}` : String(value);
  });
}

export function pickLocaleValue<T>(
  locale: 'ar' | 'en',
  values: { ar: T; en: T },
): T {
  return locale === 'en' ? values.en : values.ar;
}
