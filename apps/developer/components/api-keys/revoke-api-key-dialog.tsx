'use client';

import { Key } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';

interface RevokeApiKeyDialogProps {
  open: boolean;
  keyName?: string;
  maskedKey?: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RevokeApiKeyDialog({
  open,
  keyName,
  maskedKey,
  isPending,
  onClose,
  onConfirm,
}: RevokeApiKeyDialogProps) {
  const t = useTranslations();
  const s = t.apiKeys;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={s.cancel}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="dashboard-card relative w-full max-w-md rounded-2xl p-6 sm:rounded-3xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--danger)_12%,var(--background))] text-[var(--danger)]">
            <Key className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {s.revokeTitle}
            </h2>
            {keyName ? (
              <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
                {keyName}
              </p>
            ) : null}
            {maskedKey ? (
              <code
                dir="ltr"
                className="mt-1 block font-mono text-[11px] text-[var(--muted-foreground)]"
              >
                {maskedKey}
              </code>
            ) : null}
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {s.revokeConfirm}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-50"
          >
            {s.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-xl bg-[var(--danger)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? s.revoking : s.revoke}
          </button>
        </div>
      </div>
    </div>
  );
}
