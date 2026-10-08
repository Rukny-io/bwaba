'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

interface ProductImageUploadButtonProps {
  disabled?: boolean;
  label?: string;
  variant?: 'pill' | 'tile';
  className?: string;
  onPick: (files: File[]) => void | Promise<void>;
}

export function ProductImageUploadButton({
  disabled = false,
  label,
  variant = 'pill',
  className,
  onPick,
}: ProductImageUploadButtonProps) {
  const { t } = useTranslations();
  const resolvedLabel = label ?? t('products.uploadImage');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;

    setBusy(true);
    try {
      await onPick(files);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => void handleChange(event)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'inline-flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50',
          variant === 'tile'
            ? 'size-14 shrink-0 flex-col gap-0.5 rounded-xl text-[10px] font-medium'
            : 'h-9 gap-2 rounded-full px-3.5 text-[12px] font-medium',
          className,
        )}
      >
        {busy ? (
          <Loader2
            className={cn('animate-spin', variant === 'tile' ? 'size-4' : 'size-3.5')}
            aria-hidden
          />
        ) : (
          <ImagePlus
            className={cn(variant === 'tile' ? 'size-4' : 'size-3.5')}
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        {resolvedLabel}
      </button>
    </>
  );
}
