'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildEmailEndpointCodeSample,
  buildEmailRecipeCodeSample,
  type EmailCodeSampleLanguage,
  type EmailCodeSampleRecipe,
} from '@/lib/email-api-code-samples';
import type { EmailApiEndpoint } from '@/lib/email-api-catalog';

const LANGUAGES: { id: EmailCodeSampleLanguage; label: string }[] = [
  { id: 'sdk', label: 'SDK' },
  { id: 'curl', label: 'curl' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
];

interface EmailApiCodePanelProps {
  endpoint?: EmailApiEndpoint;
  recipes?: EmailCodeSampleRecipe[];
  className?: string;
  defaultLanguage?: EmailCodeSampleLanguage;
}

export function EmailApiCodePanel({
  endpoint,
  recipes,
  className,
  defaultLanguage = 'sdk',
}: EmailApiCodePanelProps) {
  const [language, setLanguage] =
    useState<EmailCodeSampleLanguage>(defaultLanguage);
  const [recipeId, setRecipeId] = useState(recipes?.[0]?.id ?? 'default');
  const [copied, setCopied] = useState(false);

  const activeRecipe = recipes?.find((item) => item.id === recipeId);
  const code = activeRecipe
    ? buildEmailRecipeCodeSample(language, activeRecipe)
    : endpoint
      ? buildEmailEndpointCodeSample(language, endpoint)
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
              {recipe.label}
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
          {copied ? 'Copied' : 'Copy'}
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
