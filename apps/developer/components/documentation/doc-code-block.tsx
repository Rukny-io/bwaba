'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  defaultFilenameForLanguage,
  highlightDocCode,
  normalizeDocLanguage,
  type DocCodeLanguage,
} from '@/lib/doc-syntax-highlight';
import { cn } from '@/lib/utils';

export function DocCodeBlock({
  code,
  language,
  filename,
  title,
  className,
}: {
  code: string;
  language?: string;
  filename?: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lang = normalizeDocLanguage(language);
  const headerLabel =
    filename ?? defaultFilenameForLanguage(lang, title ?? filename);
  const highlighted = highlightDocCode(code, lang);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[#0d1117] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        className,
      )}
      dir="ltr"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#21262d] bg-[#161b22] px-3.5 py-2 sm:px-4">
        <span className="truncate font-mono text-[11.5px] text-[#8b949e]">
          {headerLabel}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
            copied
              ? 'text-[#7ee787]'
              : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]',
          )}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <pre className="overflow-x-auto px-3.5 py-3.5 sm:px-4 sm:py-4">
        <code
          className="block font-mono text-[12px] leading-[1.65] sm:text-[12.5px]"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

/** Back-compat wrapper used across documentation pages. */
export function DocCode({
  children,
  language,
  filename,
  title,
}: {
  children: string;
  language?: string;
  filename?: string;
  title?: string;
}) {
  return (
    <DocCodeBlock
      code={children}
      language={language}
      filename={filename}
      title={title}
    />
  );
}
