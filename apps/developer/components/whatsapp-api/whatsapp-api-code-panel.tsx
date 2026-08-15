'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WEBHOOK_VERIFY_SAMPLES,
  type CodeSampleLanguage,
  buildEndpointCodeSample,
  buildRecipeCodeSample,
  type CodeSampleRecipe,
} from '@/lib/whatsapp-api-code-samples';
import type { WhatsappApiEndpoint } from '@/lib/whatsapp-api-catalog';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';

const LANGUAGES: { id: CodeSampleLanguage; label: string }[] = [
  { id: 'curl', label: 'curl' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
];

interface WhatsappApiCodePanelProps {
  endpoint?: WhatsappApiEndpoint;
  recipes?: CodeSampleRecipe[];
  copyLabel: string;
  className?: string;
}

export function WhatsappApiCodePanel({
  endpoint,
  recipes,
  copyLabel,
  className,
}: WhatsappApiCodePanelProps) {
  const d = WHATSAPP_API_COPY;
  const recipeLabels = d as Record<string, string>;
  const [language, setLanguage] = useState<CodeSampleLanguage>('curl');
  const [recipeId, setRecipeId] = useState(recipes?.[0]?.id ?? 'default');
  const [copied, setCopied] = useState(false);

  const activeRecipe = recipes?.find((item) => item.id === recipeId);
  const code = activeRecipe
    ? buildRecipeCodeSample(language, activeRecipe)
    : endpoint
      ? buildEndpointCodeSample(language, endpoint)
      : '';

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={cn('space-y-3', className)}>
      {recipes && recipes.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setRecipeId(recipe.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors',
                recipeId === recipe.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {recipeLabels[recipe.labelKey] ?? recipe.id}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors',
                language === item.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copyLabel}
        </button>
      </div>

      <pre
        className="overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 text-[12px] leading-relaxed text-[var(--foreground)]"
        dir="ltr"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function WhatsappApiWebhookCodePanel({ copyLabel }: { copyLabel: string }) {
  const [language, setLanguage] = useState<CodeSampleLanguage>('node');
  const [copied, setCopied] = useState(false);
  const code = WEBHOOK_VERIFY_SAMPLES[language];

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLanguage(item.id)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors',
                language === item.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copyLabel}
        </button>
      </div>
      <pre
        className="overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 text-[12px] leading-relaxed text-[var(--foreground)]"
        dir="ltr"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
