"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, SearchX } from "lucide-react";
import { cn } from "@heroui/react";
import {
  filterMailTutorialArticles,
  listMailTutorialArticlesByCategory,
  MAIL_TUTORIAL_ARTICLES,
  MAIL_TUTORIAL_CATEGORIES,
  type MailTutorialCategoryId,
} from "@/lib/mail-tutorials";
import { mailMarketingLayout as L } from "@/lib/mail-marketing-theme";

function pillClass(active: boolean) {
  return cn(
    "inline-flex min-h-9 items-center rounded-full px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm",
    active
      ? "bg-[#062c30] text-white"
      : "bg-white text-[#132327]/55 ring-1 ring-[#E8ECF0] hover:text-[#132327]",
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
    <main className="overflow-x-clip pt-14">
      <section className={L.heroPad}>
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <p className={`mail-hero-enter ${L.heroBadge}`}>Help center</p>
          <div className="mail-hero-enter-delayed mt-5 flex size-14 items-center justify-center rounded-2xl border border-[#E8ECF0] bg-white shadow-[0_8px_32px_rgba(19,35,39,0.06)]">
            <BookOpen className="size-6 text-[#062c30]" strokeWidth={1.75} aria-hidden />
          </div>
          <h1 className={`mail-hero-enter-delayed mt-5 ${L.heroTitle}`}>
            Email tutorials
          </h1>
          <p className={`mail-hero-enter-delayed mt-4 max-w-xl ${L.heroLead}`}>
            Step-by-step guides for domain setup, mailboxes, routing, and delivery —
            no sign-in required.
          </p>
          <p className="mail-hero-enter-delayed mt-3 text-sm font-medium text-[#132327]/45">
            {articleCount} articles
          </p>
        </div>
      </section>

      <section className={`${L.container} pb-6`}>
        <div className="relative mx-auto max-w-xl">
          <Search
            className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#132327]/40"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tutorials: DNS, alias, inbox…"
            aria-label="Search tutorials"
            className="h-12 w-full rounded-2xl border border-[#E8ECF0] bg-white ps-11 pe-4 text-sm text-[#132327] shadow-[0_4px_20px_rgba(19,35,39,0.04)] outline-none placeholder:text-[#132327]/40 focus:border-[#062c30]/25"
          />
        </div>

        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          <button type="button" onClick={() => setCategory("all")} className={pillClass(category === "all")}>
            All
          </button>
          {MAIL_TUTORIAL_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={pillClass(category === item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className={`${L.container} space-y-10 pb-12 sm:space-y-12 sm:pb-16 md:pb-[72px]`}>
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E8ECF0] bg-white px-6 py-16 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-[#F6F7F8] text-[#132327]/45">
              <SearchX className="size-5" aria-hidden />
            </div>
            <p className="max-w-sm text-sm text-[#132327]/55">
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
                    className="text-xl font-semibold tracking-tight text-[#132327] sm:text-2xl"
                  >
                    {group.label}
                  </h2>
                  <p className="mt-1 text-sm text-[#132327]/50">{group.description}</p>
                </div>
                <p className="text-xs font-medium text-[#132327]/40">
                  {articles.length} article{articles.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/tutorials/${article.slug}`}
                    className="group flex items-start gap-4 rounded-2xl border border-[#E8ECF0] bg-white px-4 py-4 transition-colors hover:bg-[#F6F7F8]/80 sm:px-5 sm:py-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-snug text-[#132327] transition-colors group-hover:text-[#062c30] sm:text-base">
                        {article.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#132327]/50 sm:text-sm">
                        {article.summary}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-[#132327]/35">
                        {article.duration} read
                      </p>
                    </div>
                    <ArrowRight
                      className="mt-1 size-4 shrink-0 text-[#132327]/25 transition-transform group-hover:-translate-x-0.5 group-hover:text-[#062c30]"
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
