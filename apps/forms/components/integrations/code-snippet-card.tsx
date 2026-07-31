'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

type CodeLanguage = 'url' | 'html' | 'javascript';

const languageLabels: Record<Exclude<CodeLanguage, 'url'>, string> = {
  html: 'HTML',
  javascript: 'JS',
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightCode(code: string, language: CodeLanguage): string {
  const escaped = escapeHtml(code);
  if (language === 'url') return escaped;

  if (language === 'html') {
    return escaped
      .replace(
        /(&lt;\/?)([\w-]+)/g,
        '$1<span class="text-[color-mix(in_srgb,var(--primary)_88%,white)]">$2</span>',
      )
      .replace(
        /([\w-]+)(=)(&quot;[^&]*&quot;)/g,
        '<span class="text-[color-mix(in_srgb,var(--foreground)_72%,transparent)]">$1</span>$2<span class="text-[color-mix(in_srgb,var(--success)_75%,white)]">$3</span>',
      );
  }

  return escaped
    .replace(
      /\b(const|let|function|if|return|typeof|window|document|addEventListener|instanceof|event)\b/g,
      '<span class="text-[color-mix(in_srgb,var(--primary)_88%,white)]">$1</span>',
    )
    .replace(
      /('[^']*'|"[^"]*")/g,
      '<span class="text-[color-mix(in_srgb,var(--success)_75%,white)]">$1</span>',
    );
}

export function CodeSnippetCard({
  title,
  description,
  code,
  copyLabel,
  language = 'html',
}: {
  title: string;
  description?: string;
  code: string;
  copyLabel: string;
  language?: CodeLanguage;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    appToast.success('تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:rounded-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {language !== 'url' ? (
            <span className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {languageLabels[language]}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              copied
                ? 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,var(--surface-secondary))]',
            )}
            aria-label={copyLabel}
          >
            {copied ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <Copy className="size-3.5 shrink-0" />
            )}
            <span>{copied ? 'تم النسخ' : copyLabel}</span>
          </button>
        </div>
      </div>

      <div className="bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))]">
        <pre
          dir="ltr"
          className={cn(
            'overflow-x-auto px-4 py-4 font-mono text-[11px] leading-[1.7] sm:px-5 sm:text-xs',
            language === 'url' ? 'whitespace-nowrap' : 'max-h-[min(360px,50vh)] whitespace-pre',
          )}
        >
          <code
            className="block text-[var(--foreground)]"
            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
          />
        </pre>
      </div>
    </section>
  );
}
