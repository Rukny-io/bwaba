'use client';

import { useId, useRef } from 'react';
import { FileAudio, FileText, FileVideo, Loader2, Upload, X } from 'lucide-react';
import { ProductFormSection } from '@/components/products/create/product-form-section';
import { cn } from '@/lib/utils';

const ACCEPT =
  '.pdf,.zip,.mp4,.mp3,application/pdf,application/zip,application/x-zip-compressed,video/mp4,audio/mpeg';

interface ProductDigitalFileUploadProps {
  file: File | null;
  uploading?: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} ب`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

function fileKindIcon(file: File) {
  if (file.type.startsWith('video/')) return FileVideo;
  if (file.type.startsWith('audio/')) return FileAudio;
  return FileText;
}

export function ProductDigitalFileUpload({
  file,
  uploading = false,
  onPick,
  onRemove,
  className,
}: ProductDigitalFileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    event.target.value = '';
    if (next) onPick(next);
  }

  function openPicker() {
    if (!uploading) inputRef.current?.click();
  }

  const FileIcon = file ? fileKindIcon(file) : Upload;

  return (
    <ProductFormSection
      title="ملف المنتج الرقمي"
      description="يُسلّم للعميل تلقائياً بعد إتمام الشراء · PDF، ZIP، MP4، MP3"
      className={className}
      contentClassName="gap-3"
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={handleChange}
      />

      {file ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3',
            uploading && 'opacity-70',
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <FileIcon className="size-4" strokeWidth={1.75} aria-hidden />
          </div>

          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
              {file.name}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
              {formatFileSize(file.size)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[12px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              استبدال
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="إزالة الملف"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className={cn(
            'group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-4 py-8 text-center transition-colors',
            'hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-secondary)]/70',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
          ) : (
            <>
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
                <Upload className="size-4" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="text-[13px] font-medium text-[var(--foreground)]">
                  اختر ملف المنتج
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                  PDF، ZIP، فيديو MP4، أو صوت MP3
                </p>
              </div>
            </>
          )}
        </button>
      )}
    </ProductFormSection>
  );
}
