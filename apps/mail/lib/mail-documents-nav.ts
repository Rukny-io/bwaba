import {
  listMailTutorialArticlesByCategory,
  MAIL_TUTORIAL_ARTICLES,
  type MailTutorialCategoryId,
} from "@/lib/mail-tutorials";

export const DOCUMENTS_BASE = "/documents";

export type MailDocumentsNavItem = {
  slug: string;
  label: string;
  href: string;
};

export type MailDocumentsNavGroup = {
  id: MailTutorialCategoryId;
  label: string;
  description: string;
  items: MailDocumentsNavItem[];
};

export function getMailDocumentsNavGroups(): MailDocumentsNavGroup[] {
  return listMailTutorialArticlesByCategory().map(({ category, articles }) => ({
    id: category.id,
    label: category.label,
    description: category.description,
    items: articles.map((article) => ({
      slug: article.slug,
      label: article.title,
      href: `${DOCUMENTS_BASE}/${article.slug}`,
    })),
  }));
}

export function getMailDocumentHref(slug: string) {
  return `${DOCUMENTS_BASE}/${slug}`;
}

export function isMailDocumentsPath(pathname: string) {
  return (
    pathname === DOCUMENTS_BASE || pathname.startsWith(`${DOCUMENTS_BASE}/`)
  );
}

export function isMailDocNavActive(pathname: string, href: string) {
  return pathname === href;
}

export const MAIL_DOCUMENTS_COUNT = MAIL_TUTORIAL_ARTICLES.length;
