'use client';

import { useId, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface CollectionImageUploadProps {
  variant: 'banner' | 'thumbnail';
  value?: string | null;
  previewUrl?: string | null;
  uploading?: boolean;
  onPick: (file: File) => void;
  onRemove?: () => void;
  className?: string;
}

export function CollectionImageUpload({
  variant,
  value,
  previewUrl,
  uploading = false,
  onPick,
  onRemove,
  className,
}: CollectionImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const resolvedPreview = previewUrl ?? resolveMediaUrl(value);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPick(file);
  }

  if (variant === 'banner') {
    return (
      <div className={cn('relative', className)}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleChange}
        />

        <label
          htmlFor={inputId}
          className={cn(
            'group relative flex min-h-[5.25rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-[rgba(34,34,34,0.14)] bg-[rgba(34,34,34,0.02)] px-3 py-4 text-center transition-colors hover:border-[rgba(34,34,34,0.22)] hover:bg-[rgba(34,34,34,0.04)] dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-white/25 sm:min-h-[5.75rem]',
            resolvedPreview && 'min-h-[5.75rem] border-solid border-[rgba(34,34,34,0.1)] bg-transparent p-0 dark:border-white/10 sm:min-h-[6rem]',
          )}
        >
          {resolvedPreview ? (
            <>
              <Image
                src={resolvedPreview}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50rem"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--surface)]/70 text-[var(--muted-foreground)]">
                <ImagePlus className="size-4" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
                أضف صورة البانر
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]/65">
                3200 × 410 بكسل
              </p>
            </div>
          )}

          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
              <Loader2 className="size-5 animate-spin text-white" aria-hidden />
            </div>
          ) : null}
        </label>

        {resolvedPreview && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="absolute left-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            aria-label="إزالة صورة البانر"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn('relative shrink-0', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
      />

      <label
        htmlFor={inputId}
        className={cn(
          'group relative flex size-14 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[rgba(34,34,34,0.14)] bg-[rgba(34,34,34,0.02)] transition-colors hover:border-[rgba(34,34,34,0.22)] hover:bg-[rgba(34,34,34,0.04)] dark:border-white/15 dark:bg-white/[0.03] dark:hover:border-white/25',
          resolvedPreview && 'border-solid border-[rgba(34,34,34,0.1)] bg-transparent dark:border-white/10',
        )}
      >
        {resolvedPreview ? (
          <Image
            src={resolvedPreview}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <ImagePlus
            className="size-[18px] text-[var(--muted-foreground)]/75"
            strokeWidth={1.5}
          />
        )}

        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
            <Loader2 className="size-4 animate-spin text-white" aria-hidden />
          </div>
        ) : null}
      </label>

      {resolvedPreview && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-[var(--border)]/80 bg-[var(--surface)] text-[var(--muted-foreground)] shadow-sm transition-colors hover:text-[var(--foreground)]"
          aria-label="إزالة صورة الشعار"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}
