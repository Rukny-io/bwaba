'use client';

import { useRef, useState } from 'react';
import { Button, Label, Spinner } from '@heroui/react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { ApiException } from '@/lib/api-client';
import { updateForm, uploadFormCoverImage } from '@/lib/forms-api';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_MB = 5;

interface FormCoverUploadProps {
  formId: string;
  coverUrl: string | null;
  onCoverChange: (url: string | null) => void;
  /** Hide duplicate section header when embedded in another layout */
  embedded?: boolean;
}

export function FormCoverUpload({
  formId,
  coverUrl,
  onCoverChange,
  embedded = false,
}: FormCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPT.split(',').includes(file.type)) {
      setError('الصيغ المسموحة: JPEG أو PNG أو WebP');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`الحد الأقصى ${MAX_MB} ميجابايت`);
      return;
    }

    setError(null);
    setBusy(true);
    const preview = URL.createObjectURL(file);
    onCoverChange(preview);

    try {
      const updated = await uploadFormCoverImage(formId, file);
      onCoverChange(updated.coverImage ?? preview);
    } catch (err) {
      onCoverChange(coverUrl);
      setError(
        err instanceof ApiException
          ? err.message
          : err instanceof Error
            ? err.message
            : 'تعذّر رفع الغلاف',
      );
    } finally {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    try {
      const updated = await updateForm(formId, { coverImage: null });
      onCoverChange(updated.coverImage ?? null);
    } catch (err) {
      setError(
        err instanceof ApiException ? err.message : 'تعذّر إزالة الغلاف',
      );
    } finally {
      setBusy(false);
    }
  }

  function openFilePicker() {
    if (!busy) inputRef.current?.click();
  }

  return (
    <section className={cn('space-y-2', embedded && 'space-y-3')}>
      {!embedded ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            غلاف النموذج
          </Label>
          <span className="text-[11px] text-[var(--muted-foreground)]">
            اختياري · يظهر أعلى النموذج العام
          </span>
        </div>
      ) : null}

      <div
        role={coverUrl ? undefined : 'button'}
        tabIndex={coverUrl ? undefined : 0}
        onClick={coverUrl ? undefined : openFilePicker}
        onKeyDown={
          coverUrl
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFilePicker();
                }
              }
        }
        className={cn(
          'relative overflow-hidden rounded-2xl border border-[var(--border)] sm:rounded-3xl',
          !coverUrl &&
            'cursor-pointer transition-colors hover:border-[var(--muted-foreground)]/35 hover:bg-[var(--surface-secondary)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40',
          coverUrl
            ? 'aspect-[2/1] min-h-[100px] sm:aspect-[3/1] sm:min-h-[120px]'
            : 'min-h-[112px] sm:min-h-[128px]',
        )}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="flex size-full min-h-[112px] flex-col items-center justify-center gap-2 bg-[var(--surface-secondary)]/60 px-4 py-6 text-center sm:min-h-[128px]">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface)] shadow-sm">
              <ImagePlus
                className="size-5 text-[var(--muted-foreground)]"
                aria-hidden
              />
            </div>
            <p className="text-xs font-medium text-[var(--foreground)]">
              اضغط لرفع غلاف
            </p>
            <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)]">
              JPEG أو PNG أو WebP · حتى {MAX_MB} ميجابايت
            </p>
          </div>
        )}

        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/60">
            <Spinner size="sm" />
          </div>
        ) : null}

        <div
          className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/50 via-black/25 to-transparent p-3 pt-8 sm:inset-x-auto sm:bottom-3 sm:end-3 sm:start-auto sm:bg-none sm:p-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="sm"
            variant="primary"
            onPress={openFilePicker}
            isDisabled={busy}
            className="min-h-10 flex-1 rounded-xl sm:flex-none sm:rounded-full"
          >
            {coverUrl ? 'تغيير' : 'رفع صورة'}
          </Button>
          {coverUrl ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onPress={() => void handleRemove()}
              isDisabled={busy}
              className="min-h-10 shrink-0 rounded-xl bg-[var(--surface)]/95 shadow-md backdrop-blur-sm sm:rounded-full"
              aria-label="إزالة الغلاف"
            >
              <Trash2 className="size-4" data-slot="icon" />
            </Button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />

      {error ? (
        <p className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
