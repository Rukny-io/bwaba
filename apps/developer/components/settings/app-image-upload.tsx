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

  return (
    <div className="settings-row flex w-full items-center gap-3 px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4">
      <div
        className={cn(
          'relative flex size-11 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)]/80 bg-[var(--surface-secondary)]',
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
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {initial}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1 text-start">
        <p className="text-[14px] font-medium leading-snug text-[var(--foreground)]">
          {label}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-60"
        >
          <ImagePlus className="size-3.5" strokeWidth={1.85} aria-hidden />
          {hint ?? label}
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
