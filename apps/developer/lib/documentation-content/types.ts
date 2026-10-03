import type { Locale } from '@/lib/locale';

export type Localized<T> = { en: T; ar: T };

export function docCopy<T>(locale: Locale, content: Localized<T>): T {
  return content[locale] ?? content.en;
}

export type DocTocItem = { id: string; label: string };

export type DocMeta = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  description: string;
  toc: DocTocItem[];
};
