"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { cn } from "@heroui/react";
import { MailReveal } from "@/components/marketing/mail-reveal";
import { MAIL_DOC_CATEGORY_ICONS } from "@/lib/mail-documents-icons";
import {
  getMailDocumentHref,
  getMailDocumentsNavGroups,
  MAIL_DOCUMENTS_COUNT,
} from "@/lib/mail-documents-nav";
import {
  filterMailTutorialArticles,
  getMailTutorialCategory,
} from "@/lib/mail-tutorials";
import { agLayout } from "@/lib/mail-antigravity-theme";

export function MailDocumentsHubPage({
  eyebrow = "Documentation",
  title = "Learn Rukny Mail",
  description = "Domain DNS, mailboxes, routing, and delivery — short guides you can follow in the console.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
} = {}) {
  const [query, setQuery] = useState("");
  const groups = getMailDocumentsNavGroups();

  const filtered = useMemo(
    () => filterMailTutorialArticles(query, "all"),
    [query],
  );

  const hasQuery = query.trim().length > 0;
  const featured = groups.flatMap((group) => group.items).slice(0, 3);

  return (
    <main className="overflow-x-clip bg-white text-[#1D1D1D]">
      <section className="border-b border-[#E8E8E8]">
        <div className={`${agLayout.container} pb-14 pt-16 sm:pb-16 sm:pt-20`}>
          <MailReveal className="mx-auto max-w-2xl text-center">
            <p className={agLayout.pill}>{eyebrow}</p>
            <h1 className={`${agLayout.heroTitle} mt-6`}>{title}</h1>
            <p className={`${agLayout.lead} mx-auto mt-5 max-w-xl`}>
              {description}
            </p>

            <div className="relative mx-auto mt-10 max-w-lg">
              <Search
                className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides…"
                aria-label="Search guides"
                className="h-12 w-full rounded-full border border-[#E8E8E8] bg-white ps-11 pe-5 text-[15px] text-[#1D1D1D] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#1D1D1D]"
              />
            </div>
            <p className="mt-4 text-[13px] text-[#9CA3AF]">
              {MAIL_DOCUMENTS_COUNT} guides · no sign-in required
            </p>
          </MailReveal>
        </div>
      </section>

      <div className={`${agLayout.container} pb-20 pt-12 sm:pb-24 sm:pt-14`}>
        {hasQuery ? (
          <section aria-label="Search results">
            <h2 className="text-[13px] font-medium text-[#6B6F76]">Results</h2>
            {filtered.length === 0 ? (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E8E8E8] bg-[#FAFAFA] px-6 py-16 text-center">
                <SearchX className="size-5 text-[#9CA3AF]" aria-hidden />
                <p className="max-w-sm text-sm text-[#6B6F76]">
                  No guides matched “{query.trim()}”.
                </p>
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-[#E8E8E8] overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
                {filtered.map((article) => {
                  const category = getMailTutorialCategory(article.category);
                  return (
                    <li key={article.slug}>
                      <Link
                        href={getMailDocumentHref(article.slug)}
                        className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA] sm:px-6"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-[#9CA3AF]">
                            {category?.label}
                          </p>
                          <p className="mt-1 text-[15px] font-medium text-[#1D1D1D]">
                            {article.title}
                          </p>
                          <p className="mt-1 text-[13px] leading-5 text-[#6B6F76]">
                            {article.summary}
                          </p>
                        </div>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-[#9CA3AF] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : (
          <>
            <section aria-labelledby="start-here">
              <MailReveal>
                <h2
                  id="start-here"
                  className="text-[13px] font-medium text-[#6B6F76]"
                >
                  Start here
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {featured.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        agLayout.card,
                        "group flex min-h-[10rem] flex-col justify-between",
                      )}
                    >
                      <span className="font-mono text-[11px] tracking-[0.14em] text-[#9CA3AF]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-base font-medium leading-snug text-[#1D1D1D]">
                          {item.label}
                        </p>
                        <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[#6B6F76] transition-colors group-hover:text-[#1D1D1D]">
                          Read
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </MailReveal>
            </section>

            <section className="mt-16 space-y-10" aria-label="All topics">
              {groups.map((group, groupIndex) => {
                const Icon = MAIL_DOC_CATEGORY_ICONS[group.id];
                return (
                  <MailReveal
                    key={group.id}
                    delay={Math.min(groupIndex * 0.05, 0.2)}
                  >
                    <div id={group.id} className="scroll-mt-28">
                      <div className="mb-4 flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#1D1D1D]">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-[1.15rem] font-medium tracking-[0em] text-[#1D1D1D]">
                            {group.label}
                          </h2>
                          <p className="mt-0.5 text-sm text-[#6B6F76]">
                            {group.description}
                          </p>
                        </div>
                      </div>
                      <ul className="overflow-hidden rounded-2xl border border-[#E8E8E8] bg-white">
                        {group.items.map((item, index) => (
                          <li
                            key={item.href}
                            className={cn(
                              index > 0 && "border-t border-[#E8E8E8]",
                            )}
                          >
                            <Link
                              href={item.href}
                              className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-[#FAFAFA]"
                            >
                              <span className="min-w-0 truncate text-[15px] font-medium text-[#1D1D1D]">
                                {item.label}
                              </span>
                              <ArrowRight className="size-3.5 shrink-0 text-[#9CA3AF] transition-transform group-hover:translate-x-0.5 group-hover:text-[#1D1D1D]" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </MailReveal>
                );
              })}
            </section>

            <MailReveal className="mt-16 grid gap-4 sm:grid-cols-2">
              <Link
                href="/getting-started"
                className={cn(agLayout.card, "block")}
              >
                <p className="text-[12px] font-medium text-[#9CA3AF]">
                  Quick path
                </p>
                <h3 className="mt-2 text-[15px] font-medium text-[#1D1D1D]">
                  Getting started
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[#6B6F76]">
                  Three steps from account to you@yourdomain.
                </p>
              </Link>
              <Link
                href="/login?next=/apps"
                className={cn(agLayout.card, "block")}
              >
                <p className="text-[12px] font-medium text-[#9CA3AF]">Console</p>
                <h3 className="mt-2 text-[15px] font-medium text-[#1D1D1D]">
                  Open workspace
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[#6B6F76]">
                  Connect DNS and manage mailboxes.
                </p>
              </Link>
            </MailReveal>
          </>
        )}
      </div>
    </main>
  );
}
