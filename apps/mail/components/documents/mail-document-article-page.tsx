"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MailDocumentsArticle,
  MailDocLinkCard,
  MailDocPager,
  MailDocSection,
} from "@/components/documents/mail-docs-article";
import {
  DOCUMENTS_BASE,
  getMailDocumentHref,
} from "@/lib/mail-documents-nav";
import {
  getMailTutorialArticle,
  getMailTutorialCategory,
  MAIL_TUTORIAL_ARTICLES,
  type MailTutorialArticle,
} from "@/lib/mail-tutorials";

export function MailDocumentArticlePage({
  article,
}: {
  article: MailTutorialArticle;
}) {
  const category = getMailTutorialCategory(article.category);

  const toc = useMemo(
    () =>
      article.sections.map((section) => ({
        id: section.id,
        label: section.title,
      })),
    [article.sections],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [article.slug]);

  const related = article.relatedSlugs
    .map((slug) => getMailTutorialArticle(slug))
    .filter((item): item is MailTutorialArticle => item != null);

  const index = MAIL_TUTORIAL_ARTICLES.findIndex(
    (item) => item.slug === article.slug,
  );
  const prev = index > 0 ? MAIL_TUTORIAL_ARTICLES[index - 1] : null;
  const next =
    index >= 0 && index < MAIL_TUTORIAL_ARTICLES.length - 1
      ? MAIL_TUTORIAL_ARTICLES[index + 1]
      : null;

  return (
    <MailDocumentsArticle
      eyebrow={category?.label ?? "Documents"}
      title={article.title}
      description={article.summary}
      meta={`Updated ${article.lastUpdated} · ${article.duration} read`}
      toc={toc}
    >
      {article.sections.map((section, sectionIndex) => (
        <MailDocSection
          key={section.id}
          id={section.id}
          title={section.title}
          index={sectionIndex}
        >
          {section.paragraphs?.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {section.bullets?.length ? (
            <ul className="list-disc space-y-2.5 ps-5 marker:text-[var(--muted-foreground)]">
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </MailDocSection>
      ))}

      {related.length > 0 ? (
        <section className="space-y-3 border-t border-[var(--border)] pt-10">
          <h2 className="text-[1.25rem] font-semibold tracking-tight text-[var(--foreground)]">
            Related guides
          </h2>
          <div className="space-y-2">
            {related.map((item) => (
              <MailDocLinkCard
                key={item.slug}
                href={getMailDocumentHref(item.slug)}
                title={item.title}
                description={item.summary}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="pt-2">
        <MailDocPager
          prev={
            prev
              ? { href: getMailDocumentHref(prev.slug), label: prev.title }
              : { href: DOCUMENTS_BASE, label: "All documents" }
          }
          next={
            next
              ? { href: getMailDocumentHref(next.slug), label: next.title }
              : undefined
          }
        />
      </div>

      <p className="border-t border-[var(--border)] pt-8 text-[15px] text-[var(--muted-foreground)]">
        Ready to apply this?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          Sign in to the console
        </Link>
        .
      </p>
    </MailDocumentsArticle>
  );
}
