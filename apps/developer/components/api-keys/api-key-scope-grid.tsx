'use client';

import { Check } from 'lucide-react';
import { ALL_API_KEY_SCOPES, toggleScope } from '@/lib/api/scopes';
import { cn } from '@/lib/utils';

interface ApiKeyScopeGridProps {
  selectedScopes: string[];
  scopeLabels: Record<string, string>;
  onChange: (scopes: string[]) => void;
}

export function ApiKeyScopeGrid({
  selectedScopes,
  scopeLabels,
  onChange,
}: ApiKeyScopeGridProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ALL_API_KEY_SCOPES.map((scope) => {
        const selected = selectedScopes.includes(scope);
        return (
          <button
            key={scope}
            type="button"
            onClick={() => onChange(toggleScope(selectedScopes, scope))}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-start text-[13px] transition-colors',
              selected
                ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] text-[var(--foreground)]'
                : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]/50',
            )}
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                selected
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border-[var(--border)] bg-[var(--background)]',
              )}
            >
              {selected ? <Check className="size-3" strokeWidth={2.5} /> : null}
            </span>
            <span className="leading-snug">{scopeLabels[scope] ?? scope}</span>
          </button>
        );
      })}
    </div>
  );
}
