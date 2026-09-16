import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  MailDocsOnThisPage,
  type MailDocTocItem,
} from "@/components/documents/mail-docs-toc";
import { DOCUMENTS_BASE } from "@/lib/mail-documents-nav";

export function MailDocumentsArticle({
  eyebrow,
  title,
  description,
  meta,
  toc,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: string;
  toc?: MailDocTocItem[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-10 xl:flex-row xl:gap-12">
      <article className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={DOCUMENTS_BASE}
            className="text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Documents
          </Link>
          <span className="text-[var(--border)]" aria-hidden>
            /
          </span>
          <span className="text-[var(--muted-foreground)]">{eyebrow ?? "Guide"}</span>
        </nav>

        <header className="mb-10 max-w-3xl border-b border-[var(--border)] pb-8">
          <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[var(--foreground)] sm:text-[2.6rem] sm:leading-[1.12]">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px] sm:leading-8">
              {description}
            </p>
          ) : null}
          {meta ? (
            <p className="mt-4 text-[13px] tracking-wide text-[var(--muted-foreground)]">
              {meta}
            </p>
          ) : null}
        </header>

        <div className="max-w-3xl space-y-11 text-base leading-8 text-[var(--foreground)] sm:space-y-12 sm:text-[17px] sm:leading-8">
          {children}
        </div>
      </article>

      {toc?.length ? <MailDocsOnThisPage items={toc} /> : null}
    </div>
  );
}

export function MailDocSection({
  id,
  title,
  index,
  children,
}: {
  id: string;
  title: string;
  index?: number;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="flex items-baseline gap-3 text-[1.35rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.45rem]">
        {typeof index === "number" ? (
          <span className="font-mono text-sm font-medium tracking-wide text-[var(--muted-foreground)]">
            {String(index + 1).padStart(2, "0")}
          </span>
        ) : null}
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[var(--muted-foreground)]">{children}</div>
    </section>
  );
}

export function MailDocLinkCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start justify-between gap-4 border border-[var(--border)] bg-white px-4 py-3.5 transition-colors hover:bg-[#fafafa]"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function MailDocPager({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <div className="grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex min-h-[5.5rem] flex-col justify-center bg-white px-5 py-4 transition-colors hover:bg-[#fafafa]"
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </span>
          <span className="mt-2 line-clamp-2 text-[15px] font-semibold text-[var(--foreground)]">
            {prev.label}
          </span>
        </Link>
      ) : (
        <div className="hidden bg-white sm:block" />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group flex min-h-[5.5rem] flex-col justify-center bg-white px-5 py-4 text-end transition-colors hover:bg-[#fafafa] sm:items-end"
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
            Next
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-2 line-clamp-2 text-[15px] font-semibold text-[var(--foreground)]">
            {next.label}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

export function MailDocBackLink() {
  return (
    <Link
      href={DOCUMENTS_BASE}
      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Back to documents
    </Link>
  );
}
