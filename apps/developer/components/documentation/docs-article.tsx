import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
  getDocumentationProduct,
  type DocumentationProductId,
} from '@/lib/documentation-nav';
import { DocsOnThisPage, type DocTocItem } from './docs-toc';
import { DocsSidebar } from './docs-sidebar';
import { cn } from '@/lib/utils';

export function DocumentationArticle({
  productId = 'email-api',
  title,
  description,
  toc,
  children,
}: {
  productId?: DocumentationProductId;
  title: string;
  description?: string;
  toc?: DocTocItem[];
  children: ReactNode;
}) {
  const product = getDocumentationProduct(productId);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-12 lg:py-12">
      <DocsSidebar productId={productId} />
      <article className="min-w-0 flex-1">
        <header className="mb-10 max-w-3xl">
          <p className="eyebrow-label">
            {product?.title ?? 'Documentation'}
          </p>
          <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-[var(--foreground)] sm:text-[2.5rem] sm:leading-[1.15]">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)] sm:text-[17px] sm:leading-8">
              {description}
            </p>
          ) : null}
        </header>
        <div className="max-w-3xl space-y-12 text-[15px] leading-7 text-[var(--foreground)] sm:text-base sm:leading-8">
          {children}
        </div>
      </article>
      {toc?.length ? (
        <DocsOnThisPage items={toc} />
      ) : (
        <div className="hidden w-44 shrink-0 xl:block" />
      )}
    </div>
  );
}

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-[1.35rem] font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[var(--muted-foreground)]">{children}</div>
    </section>
  );
}

export function DocH3({ children }: { children: ReactNode }) {
  return (
    <h3 className="pt-2 text-[15px] font-semibold text-[var(--foreground)]">
      {children}
    </h3>
  );
}

export function DocCallout({
  children,
  tone = 'default',
  title,
}: {
  children: ReactNode;
  tone?: 'default' | 'tip' | 'warning';
  title?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-3.5 text-[14px] leading-6',
        tone === 'warning'
          ? 'bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[var(--foreground)]'
          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {title ? (
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--foreground)]">
          {title}
        </p>
      ) : null}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function DocCode({ children }: { children: string }) {
  return (
    <pre
      className="overflow-x-auto rounded-xl bg-[var(--surface-secondary)] px-4 py-3.5 text-[12.5px] leading-relaxed text-[var(--foreground)]"
      dir="ltr"
    >
      <code>{children}</code>
    </pre>
  );
}

export function DocInlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 font-mono text-[13px] text-[var(--foreground)]">
      {children}
    </code>
  );
}

export function DocLinkCard({
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
      className="group flex items-start justify-between gap-4 rounded-xl bg-[var(--surface-secondary)] px-4 py-3.5 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)]"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function DocSteps({
  steps,
}: {
  steps: { title: string; body: ReactNode }[];
}) {
  return (
    <ol className="space-y-5">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[12px] font-semibold text-[var(--background)]">
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-medium text-[var(--foreground)]">{step.title}</p>
            <div className="mt-1 space-y-2 text-[14px] leading-6 text-[var(--muted-foreground)]">
              {step.body}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DocFeatureGrid({
  items,
}: {
  items: { title: string; description: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl bg-[var(--surface-secondary)] px-4 py-3.5"
        >
          <p className="text-[14px] font-medium text-[var(--foreground)]">
            {item.title}
          </p>
          <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl bg-[var(--surface-secondary)]">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead>
          <tr className="text-[var(--muted-foreground)]">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)]"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-[var(--muted-foreground)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocPager({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-8 sm:flex-row sm:justify-between">
      {prev ? (
        <Link
          href={prev.href}
          className="group inline-flex items-center gap-2 text-[14px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="group inline-flex items-center gap-2 text-[14px] font-medium text-[var(--foreground)]"
        >
          {next.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
