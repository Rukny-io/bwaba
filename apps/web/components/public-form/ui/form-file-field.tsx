'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  formatFileSize,
  isPublicFormFileValue,
  mimeTypesToAccept,
  uploadPublicFormFile,
  validateFileBeforeUpload,
  type PublicFormFileValue,
} from '@/lib/public-form-upload';
import { FormButton } from './form-button';

export interface FormFileFieldProps {
  id: string;
  slug?: string;
  value: unknown;
  onChange: (value: PublicFormFileValue | null) => void;
  allowedMimes?: string[];
  maxBytes?: number;
  disabled?: boolean;
  className?: string;
}

export function FormFileField({
  id,
  slug,
  value,
  onChange,
  allowedMimes,
  maxBytes,
  disabled,
  className,
}: FormFileFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const uploaded = isPublicFormFileValue(value) ? value : null;
  const accept = mimeTypesToAccept(allowedMimes ?? []);

  const processFile = useCallback(
    async (file: File) => {
      setLocalError(null);

      const validationError = validateFileBeforeUpload(file, {
        allowedMimes,
        maxBytes,
      });
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      if (!slug) {
        setLocalError('الرفع متاح بعد نشر النموذج فقط.');
        return;
      }

      setUploading(true);
      try {
        const result = await uploadPublicFormFile(slug, file);
        onChange(result);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : 'تعذّر رفع الملف.',
        );
      } finally {
        setUploading(false);
      }
    },
    [allowedMimes, maxBytes, onChange, slug],
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  return (
    <div className={cn('form-heroui-file', className)}>
      <input
        ref={inputRef}
        id={inputId}
        name={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={onInputChange}
      />

      {uploaded ? (
        <div className="pf-file-card">
          <div className="pf-file-card__icon" aria-hidden>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 text-start">
            <p className="truncate text-sm font-medium text-[color:var(--form-text-heading)]">
              {uploaded.name}
            </p>
            <p className="text-xs text-[color:var(--form-text-body)]">
              {formatFileSize(uploaded.size)}
            </p>
          </div>
          <FormButton
            type="button"
            variant="outline"
            size="sm"
            isDisabled={disabled || uploading}
            onPress={() => onChange(null)}
          >
            إزالة
          </FormButton>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !uploading) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'pf-file-drop',
            dragOver && 'pf-file-drop--active',
            (disabled || uploading) && 'opacity-60',
          )}
        >
          <span className="pf-file-drop__icon" aria-hidden>
            {uploading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-[color:var(--form-primary)] border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12 16V4m0 0 8-4m-8 4 4 4M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <span className="text-sm font-medium text-[color:var(--form-text-heading)]">
            {uploading ? 'جاري الرفع…' : 'اسحب الملف هنا أو انقر للاختيار'}
          </span>
          <span className="text-xs text-[color:var(--form-text-body)]">
            {maxBytes
              ? `حتى ${formatFileSize(maxBytes)}`
              : `حتى ${formatFileSize(10 * 1024 * 1024)}`}
          </span>
        </button>
      )}

      {localError ? (
        <p className="public-form-field-error mt-2 text-xs" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
