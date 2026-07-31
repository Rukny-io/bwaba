'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InputOTP } from '@heroui/react';
import { Key, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useRevealApiKey } from '@/hooks/use-api-keys';
import { getTwoFactorStatus } from '@/lib/api/two-factor';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

interface RevealApiKeyDialogProps {
  open: boolean;
  keyName?: string;
  keySlug?: string;
  labels: {
    title: string;
    desc: string;
    dataSection?: string;
    tokenLabel: string;
    tokenPlaceholder: string;
    reveal: string;
    revealing: string;
    cancel: string;
    copy: string;
    warning: string;
    twoFaRequired: string;
    twoFaLoading: string;
  };
  onClose: () => void;
}

export function RevealApiKeyDialog({
  open,
  keyName,
  keySlug,
  labels,
  onClose,
}: RevealApiKeyDialogProps) {
  const revealMutation = useRevealApiKey();
  const [token, setToken] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const { data: twoFaStatus, isLoading: twoFaLoading } = useQuery({
    queryKey: ['auth', '2fa', 'status'],
    queryFn: getTwoFactorStatus,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setToken('');
      setRevealedKey(null);
      setCopied(false);
      setShowKey(false);
    }
  }, [open]);

  const handleReveal = useCallback(async () => {
    if (!keySlug || token.length < 6) return;
    try {
      const result = await revealMutation.mutateAsync({ keySlug, token });
      setRevealedKey(result.key);
    } catch (error) {
      appToast.fromError(error, labels.reveal);
    }
  }, [keySlug, labels.reveal, revealMutation, token]);

  const handleCopy = useCallback(async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      appToast.error(labels.copy);
    }
  }, [labels.copy, revealedKey]);

  if (!open) return null;

  const canReveal = twoFaStatus?.enabled && !revealedKey;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={labels.cancel}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reveal-api-key-title"
        className="dashboard-card relative w-full max-w-md rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2
              id="reveal-api-key-title"
              className="text-base font-semibold text-[var(--foreground)] sm:text-lg"
            >
              {labels.title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              {labels.desc}
            </p>
            {keyName ? (
              <p className="mt-2 truncate text-sm font-medium text-[var(--foreground)]">
                {keyName}
              </p>
            ) : null}
          </div>

          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Key className="size-5" strokeWidth={1.8} />
          </span>
        </div>

        {twoFaLoading ? (
          <p className="mt-5 text-sm text-[var(--muted-foreground)]">
            {labels.twoFaLoading}
          </p>
        ) : !twoFaStatus?.enabled ? (
          <p className="mt-5 rounded-2xl bg-[color-mix(in_srgb,var(--warning)_12%,var(--background))] px-3.5 py-3 text-sm leading-relaxed text-[var(--foreground)]">
            {labels.twoFaRequired}
          </p>
        ) : revealedKey ? (
          <div className="mt-5 space-y-3">
            <p className="text-xs leading-relaxed text-[var(--warning)]">
              {labels.warning}
            </p>
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-secondary)] p-3">
              <code
                dir="ltr"
                className={cn(
                  'flex-1 break-all text-start font-mono text-xs text-[var(--foreground)] select-all sm:text-sm',
                  !showKey && 'blur-sm',
                )}
              >
                {revealedKey}
              </code>
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--background)]"
                aria-label={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? (
                  <EyeOff className="size-4 text-[var(--muted-foreground)]" />
                ) : (
                  <Eye className="size-4 text-[var(--muted-foreground)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--background)]"
                aria-label={labels.copy}
              >
                {copied ? (
                  <Check className="size-4 text-[var(--success)]" />
                ) : (
                  <Copy className="size-4 text-[var(--muted-foreground)]" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {labels.dataSection ? (
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {labels.dataSection}
              </p>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {labels.tokenLabel}
              </p>

              <div
                className="flex justify-center rounded-2xl bg-[var(--surface-secondary)] px-3 py-4"
                dir="ltr"
              >
                <InputOTP
                  maxLength={6}
                  value={token}
                  onChange={setToken}
                  onComplete={() => void handleReveal()}
                  isDisabled={revealMutation.isPending}
                  autoFocus
                >
                  <InputOTP.Group>
                    <InputOTP.Slot index={0} />
                    <InputOTP.Slot index={1} />
                    <InputOTP.Slot index={2} />
                  </InputOTP.Group>
                  <InputOTP.Separator />
                  <InputOTP.Group>
                    <InputOTP.Slot index={3} />
                    <InputOTP.Slot index={4} />
                    <InputOTP.Slot index={5} />
                  </InputOTP.Group>
                </InputOTP>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            {labels.cancel}
          </button>

          {canReveal ? (
            <button
              type="button"
              onClick={() => void handleReveal()}
              disabled={token.length < 6 || revealMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {revealMutation.isPending ? labels.revealing : labels.reveal}
            </button>
          ) : revealedKey ? (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              {labels.copy}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
