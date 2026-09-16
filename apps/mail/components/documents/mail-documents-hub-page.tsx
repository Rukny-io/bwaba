"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { cn } from "@heroui/react";
import { MAIL_DOC_CATEGORY_ICONS } from "@/lib/mail-documents-icons";
import {
  DOCUMENTS_BASE,
  getMailDocumentHref,
  getMailDocumentsNavGroups,
  MAIL_DOCUMENTS_COUNT,
} from "@/lib/mail-documents-nav";
import {
  filterMailTutorialArticles,
  getMailTutorialCategory,
} from "@/lib/mail-tutorials";

export function MailDocumentsHubPage() {
  const [query, setQuery] = useState("");
  const groups = getMailDocumentsNavGroups();

  const filtered = useMemo(
    () => filterMailTutorialArticles(query, "all"),
    [query],
  );

  const hasQuery = query.trim().length > 0;
  const featured = groups.flatMap((group) => group.items).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14 sm:pb-24">
      <header className="max-w-2xl border-b border-[var(--border)] pb-10">
        <p className="text-[13px] font-medium tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
          Documents
        </p>
        <h1 className="mt-3 text-[2.35rem] font-bold tracking-[-0.04em] text-[var(--foreground)] sm:text-[3rem] sm:leading-[1.05]">
          Learn Rukny Mail
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-[17px] sm:leading-7">
          Domain DNS, mailboxes, routing, and delivery — short guides you can
          follow in the console.
        </p>

        <div className="relative mt-8 max-w-lg">
          <Search
            className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides…"
            aria-label="Search documents"
            className="h-11 w-full border border-[var(--border)] bg-white ps-10 pe-4 text-[15px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--foreground)]"
          />
        </div>
        <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
          {MAIL_DOCUMENTS_COUNT} guides · no sign-in required
        </p>
      </header>

      {hasQuery ? (
        <section className="mt-10" aria-label="Search results">
          <h2 className="text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
            Results
          </h2>
          {filtered.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-3 border border-dashed border-[var(--border)] bg-white px-6 py-16 text-center">
              <SearchX className="size-5 text-[var(--muted-foreground)]" aria-hidden />
              <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
                No guides matched “{query.trim()}”.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[var(--border)] border border-[var(--border)] bg-white">
              {filtered.map((article) => {
                const category = getMailTutorialCategory(article.category);
                return (
                  <li key={article.slug}>
                    <Link
                      href={getMailDocumentHref(article.slug)}
                      className="group flex items-start justify-between gap-4 px-4 py-4 transition-colors hover:bg-[#fafafa] sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium tracking-[0.06em] text-[var(--muted-foreground)] uppercase">
                          {category?.label}
                        </p>
                        <p className="mt-1 text-[15px] font-semibold text-[var(--foreground)]">
                          {article.title}
                        </p>
                        <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
                          {article.summary}
                        </p>
                      </div>
                      <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <>
          <section className="mt-12" aria-labelledby="start-here">
            <div className="flex items-end justify-between gap-4">
              <h2
                id="start-here"
                className="text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase"
              >
                Start here
              </h2>
            </div>
            <div className="mt-4 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
              {featured.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-[9.5rem] flex-col justify-between bg-white p-5 transition-colors hover:bg-[#fafafa]"
                >
                  <span className="font-mono text-[11px] tracking-[0.14em] text-[var(--muted-foreground)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-base font-semibold leading-snug text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                      Read
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 space-y-10" aria-label="All topics">
            {groups.map((group) => {
              const Icon = MAIL_DOC_CATEGORY_ICONS[group.id];
              return (
                <div key={group.id} id={group.id} className="scroll-mt-28">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-[var(--border)] bg-white text-[var(--foreground)]">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-[1.15rem] font-semibold tracking-tight text-[var(--foreground)]">
                        {group.label}
                      </h2>
                      <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                        {group.description}
                      </p>
                    </div>
                  </div>
                  <ul className="border border-[var(--border)] bg-white">
                    {group.items.map((item, index) => (
                      <li
                        key={item.href}
                        className={cn(
                          index > 0 && "border-t border-[var(--border)]",
                        )}
                      >
                        <Link
                          href={item.href}
                          className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[#fafafa] sm:px-5"
                        >
                          <span className="min-w-0 truncate text-[15px] font-medium text-[var(--foreground)]">
                            {item.label}
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <section className="mt-14 grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            <Link
              href="/getting-started"
              className="bg-white p-6 transition-colors hover:bg-[#fafafa]"
            >
              <p className="text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
                Quick path
              </p>
              <h3 className="mt-2 text-[15px] font-semibold text-[var(--foreground)]">
                Getting started
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">
                Three steps from account to you@yourdomain.
              </p>
            </Link>
            <Link
              href="/login?next=/apps"
              className="bg-white p-6 transition-colors hover:bg-[#fafafa]"
            >
              <p className="text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
                Console
              </p>
              <h3 className="mt-2 text-[15px] font-semibold text-[var(--foreground)]">
                Open workspace
              </h3>
              <p className="mt-2 text-[13px] leading-6 text-[var(--muted-foreground)]">
                Connect DNS and manage mailboxes.
              </p>
            </Link>
          </section>
        </>
      )}
    </main>
  );
}
