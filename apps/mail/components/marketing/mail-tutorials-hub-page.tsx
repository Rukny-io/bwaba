"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { cn } from "@heroui/react";
import {
  filterMailTutorialArticles,
  listMailTutorialArticlesByCategory,
  MAIL_TUTORIAL_ARTICLES,
  MAIL_TUTORIAL_CATEGORIES,
  type MailTutorialCategoryId,
} from "@/lib/mail-tutorials";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

function filterClass(active: boolean) {
  return cn(
    "inline-flex min-h-9 items-center border px-3.5 py-2 text-xs font-medium transition-colors sm:text-sm",
    active
      ? "border-[#062c30] bg-[#062c30] text-white"
      : "border-[#e7e5e4] bg-white text-[#57534e] hover:border-[#1c1917]/25 hover:text-[#1c1917]",
  );
}

export function MailTutorialsHubPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MailTutorialCategoryId | "all">("all");

  const filtered = useMemo(
    () => filterMailTutorialArticles(query, category),
    [query, category],
  );

  const grouped = useMemo(() => {
    if (query.trim() || category !== "all") {
      const byCategory = new Map<MailTutorialCategoryId, typeof filtered>();
      for (const article of filtered) {
        const list = byCategory.get(article.category) ?? [];
        list.push(article);
        byCategory.set(article.category, list);
      }
      return MAIL_TUTORIAL_CATEGORIES.filter((item) => byCategory.has(item.id)).map(
        (item) => ({
          category: item,
          articles: byCategory.get(item.id) ?? [],
        }),
      );
    }
    return listMailTutorialArticlesByCategory();
  }, [filtered, query, category]);

  const articleCount = MAIL_TUTORIAL_ARTICLES.length;
  const hasQuery = query.trim().length > 0;

  return (
    <main className="overflow-x-clip">
      <section className="border-b border-[#e7e5e4]">
        <div className={L.container}>
          <div className="max-w-screen-sm space-y-6 py-12 md:py-16">
            <p className={`mail-hero-enter ${L.heroBadge}`}>Help center</p>
            <h1 className={`mail-hero-enter-delayed ${L.heroTitle}`}>
              Email tutorials
            </h1>
            <p className={`mail-hero-enter-delayed ${L.heroLead}`}>
              Step-by-step guides for domain setup, mailboxes, routing, and delivery —
              no sign-in required.
            </p>
            <p className="mail-hero-enter-delayed text-sm font-medium text-[#a8a29e]">
              {articleCount} articles
            </p>
          </div>
        </div>
      </section>

      <section className={`${L.container} border-b border-[#e7e5e4] py-8`}>
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#a8a29e]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tutorials: DNS, alias, inbox…"
            aria-label="Search tutorials"
            className="h-12 w-full border border-[#e7e5e4] bg-white ps-11 pe-4 text-sm text-[#1c1917] outline-none placeholder:text-[#a8a29e] focus:border-[#062c30]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory("all")} className={filterClass(category === "all")}>
            All
          </button>
          {MAIL_TUTORIAL_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={filterClass(category === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className={`${L.container} space-y-10 py-12 sm:space-y-12 sm:py-16 md:pb-[72px]`}>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-dashed border-[#e7e5e4] bg-white px-6 py-16 text-center">
            <div className="flex size-11 items-center justify-center border border-[#e7e5e4] bg-[#f2f3f6] text-[#a8a29e]">
              <SearchX className="size-5" aria-hidden />
            </div>
            <p className="max-w-sm text-sm text-[#57534e]">
              {hasQuery
                ? `No articles matched “${query.trim()}”. Try another keyword.`
                : "No articles in this category yet."}
            </p>
          </div>
        ) : (
          grouped.map(({ category: group, articles }) => (
            <section key={group.id} aria-labelledby={`tutorial-cat-${group.id}`}>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2
                    id={`tutorial-cat-${group.id}`}
                    className="text-xl font-bold tracking-tight text-[#1c1917] sm:text-2xl"
                  >
                    {group.label}
                  </h2>
                  <p className="mt-1 text-sm text-[#57534e]">{group.description}</p>
                </div>
                <p className="text-xs font-medium text-[#a8a29e]">
                  {articles.length} article{articles.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className={`${L.gridFrame} grid-cols-1`}>
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/tutorials/${article.slug}`}
                    className="group flex items-start gap-4 bg-white px-4 py-4 transition-colors hover:bg-[#f2f3f6] sm:px-5 sm:py-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug text-[#1c1917] transition-colors group-hover:text-[#062c30] sm:text-base">
                        {article.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#57534e] sm:text-sm">
                        {article.summary}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-[#a8a29e]">
                        {article.duration} read
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-[#a8a29e] transition-transform group-hover:translate-x-0.5 group-hover:text-[#062c30]"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </section>
    </main>
  );
}
