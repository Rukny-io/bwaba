'use client';

import { useState } from 'react';
import { ArrowUpLeft } from 'lucide-react';
import type { HelpFaqItem } from '@/lib/help/help-content';
import { getHelpCategoryMeta } from '@/lib/help/help-content';
import { HelpLinkChip } from '@/components/help/help-link';
import { cn } from '@/lib/utils';

function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query?: string;
  className?: string;
}) {
  const q = query?.trim();
  if (!q) {
    return <span className={className}>{text}</span>;
  }

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: { value: string; match: boolean }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = lower.indexOf(needle, cursor);
    if (index === -1) {
      parts.push({ value: text.slice(cursor), match: false });
      break;
    }
    if (index > cursor) {
      parts.push({ value: text.slice(cursor, index), match: false });
    }
    parts.push({
      value: text.slice(index, index + needle.length),
      match: true,
    });
    cursor = index + needle.length;
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={`${part.value}-${i}`}
            className="rounded-sm bg-[var(--brand-soft-lime)] px-0.5 text-[var(--foreground)]"
          >
            {part.value}
          </mark>
        ) : (
          <span key={`${part.value}-${i}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}

export function HelpFaqCard({
  item,
  query,
  className,
}: {
  item: HelpFaqItem;
  query?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const category = getHelpCategoryMeta(item.category);
  const longAnswer = item.answer.length > 140;
  const showFull = expanded || !longAnswer;

  return (
    <article
      id={item.id}
      className={cn(
        'flex h-full flex-col rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/30 p-3.5 sm:rounded-3xl sm:p-4',
        'transition-[border-color,background-color,box-shadow] duration-200',
        'hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] hover:bg-[color-mix(in_srgb,var(--primary)_4%,var(--surface))]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] ring-1 ring-[var(--border)]/40 sm:text-[11px]">
          {category.label}
        </span>
        <ArrowUpLeft
          className="size-3.5 shrink-0 text-[var(--muted-foreground)]/50"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <h3 className="mt-2.5 text-[14px] font-semibold leading-snug text-[var(--foreground)] sm:text-[15px]">
        <HighlightedText text={item.question} query={query} />
      </h3>

      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
        <HighlightedText
          text={showFull ? item.answer : `${item.answer.slice(0, 140).trim()}…`}
          query={query}
        />
      </p>

      {longAnswer ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 self-start text-[12px] font-semibold text-[var(--primary)] transition-opacity hover:opacity-80"
        >
          {expanded ? 'عرض أقل' : 'اقرأ المزيد'}
        </button>
      ) : null}

      {item.links && item.links.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border)]/50 pt-3">
          {item.links.map((link) => (
            <HelpLinkChip
              key={`${link.href}-${link.label}`}
              href={link.href}
              label={link.label}
              external={link.external}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
