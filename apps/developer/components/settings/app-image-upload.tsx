'use client';

import { useRef, useState } from 'react';
import { Spinner } from '@heroui/react';
import { ImagePlus, X } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

interface AppImageUploadProps {
  label: string;
  hint?: string;
  value?: string | null;
  fallbackInitial: string;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => void;
  shape?: 'square' | 'circle';
  /** Row (settings) or centered hero (e.g. WhatsApp profile on mobile). */
  variant?: 'row' | 'hero';
}

export function AppImageUpload({
  label,
  hint,
  value,
  fallbackInitial,
  uploading = false,
  onUpload,
  onClear,
  shape = 'square',
  variant = 'row',
}: AppImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(value);
  const initial = fallbackInitial.trim().charAt(0).toUpperCase() || 'A';

  async function handleFileChange(file: File | null) {
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) {
      throw new Error('invalid type');
    }
    if (file.size > MAX_BYTES) {
      throw new Error('too large');
    }
    await onUpload(file);
  }

  const isHero = variant === 'hero';
  const avatarSize = isHero ? 'size-20 sm:size-16' : 'size-11';

  return (
    <div
      className={cn(
        'w-full',
        isHero
          ? 'flex flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:items-center sm:gap-5 sm:px-5 sm:py-5 sm:text-start'
          : 'settings-row flex items-center gap-3 px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4',
      )}
    >
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden border border-[var(--border)]/80 bg-[var(--surface-secondary)]',
          avatarSize,
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
        )}
      >
        {uploading ? (
          <Spinner size="sm" />
        ) : src && !failed ? (
          <img
            src={src}
            alt={label}
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className={cn(
              'font-semibold text-[var(--foreground)]',
              isHero ? 'text-2xl sm:text-xl' : 'text-sm',
            )}
          >
            {initial}
          </span>
        )}
      </div>

      <div className={cn('min-w-0', isHero ? 'w-full sm:flex-1' : 'flex-1 text-start')}>
        <p
          className={cn(
            'font-medium leading-snug text-[var(--foreground)]',
            isHero ? 'text-[15px] sm:text-[14px]' : 'text-[14px]',
          )}
        >
          {label}
        </p>
        {isHero && hint ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5',
          isHero && 'w-full justify-center sm:w-auto sm:justify-end',
        )}
      >
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-60"
        >
          <ImagePlus className="size-3.5" strokeWidth={1.85} aria-hidden />
          {isHero ? label : (hint ?? label)}
        </button>
        {value && onClear ? (
          <button
            type="button"
            disabled={uploading}
            onClick={onClear}
            aria-label="Clear"
            className="inline-flex size-9 items-center justify-center rounded-full text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] disabled:opacity-60"
          >
            <X className="size-3.5" strokeWidth={1.85} aria-hidden />
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = '';
          if (file) void handleFileChange(file);
        }}
      />
    </div>
  );
}
