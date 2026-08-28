"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MailTutorialDesktopToc } from "@/components/marketing/mail-tutorial-desktop-toc";
import { MailTutorialSectionBlock } from "@/components/marketing/mail-tutorial-section";
import {
  getMailTutorialArticle,
  getMailTutorialCategory,
  MAIL_TUTORIAL_ARTICLES,
  type MailTutorialArticle,
} from "@/lib/mail-tutorials";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

export function MailTutorialArticlePage({ article }: { article: MailTutorialArticle }) {
  const category = getMailTutorialCategory(article.category);

  const tocItems = useMemo(
    () =>
      article.sections.map((section, index) => ({
        id: section.id,
        title: section.title,
        number: index + 1,
      })),
    [article.sections],
  );

  const related = article.relatedSlugs
    .map((slug) => getMailTutorialArticle(slug))
    .filter((item): item is MailTutorialArticle => item != null);

  return (
    <main className="overflow-x-clip pt-14">
      <section className={`${L.container} pb-12 sm:pb-16 md:pb-[72px]`}>
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/tutorials"
            className="font-medium text-[#132327]/45 transition-colors hover:text-[#062c30]"
          >
            Tutorials
          </Link>
          <span className="text-[#132327]/25" aria-hidden>
            /
          </span>
          <span className="text-[#132327]/45">{category?.label ?? article.category}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-[minmax(13rem,17rem)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16">
          <MailTutorialDesktopToc items={tocItems} className="hidden lg:block" />

          <article>
            <header className="mb-10 border-b border-[#E8ECF0] pb-8 text-start sm:mb-12 sm:pb-10 lg:mb-12 lg:border-0 lg:pb-0 lg:text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#02797E] lg:hidden">
                {category?.label}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#132327] sm:text-4xl sm:leading-tight lg:mt-0 lg:text-[2.5rem]">
                {article.title}
              </h1>
              <p className="mt-3 text-sm text-[#132327]/50 sm:text-[15px]">
                {article.summary}
              </p>
              <p className="mt-2 text-xs text-[#132327]/40">
                Updated {article.lastUpdated} · {article.duration} read
              </p>
            </header>

            <div className="space-y-10 sm:space-y-12">
              {article.sections.map((section, index) => (
                <MailTutorialSectionBlock
                  key={section.id}
                  section={section}
                  index={index}
                />
              ))}
            </div>

            {related.length > 0 ? (
              <section className="mt-14 border-t border-[#E8ECF0] pt-8">
                <h2 className="text-lg font-semibold text-[#132327]">Related guides</h2>
                <ul className="mt-4 space-y-2">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/tutorials/${item.slug}`}
                        className="group inline-flex items-center gap-2 text-[15px] font-medium text-[#062c30] hover:underline"
                      >
                        {item.title}
                        <ArrowRight
                          className="size-3.5 transition-transform group-hover:-translate-x-0.5"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <footer className="mt-14 border-t border-[#E8ECF0] pt-8">
              <Link
                href="/tutorials"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#132327]/55 transition-colors hover:text-[#062c30]"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Back to all tutorials
              </Link>
              <p className="mt-4 text-sm text-[#132327]/45">
                Ready to apply this in your workspace?{" "}
                <Link href="/login" className="font-medium text-[#062c30] hover:underline">
                  Sign in to the console
                </Link>
                .
              </p>
            </footer>
          </article>
        </div>
      </section>
    </main>
  );
}
