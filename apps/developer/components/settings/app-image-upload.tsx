'use client';

import { useRef, useState } from 'react';
import { Button, Spinner } from '@heroui/react';
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
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--foreground)]">{label}</p>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative flex size-20 shrink-0 items-center justify-center overflow-hidden border border-[var(--border)] bg-[var(--surface-secondary)]',
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
            <span className="text-xl font-semibold text-[var(--primary)]">
              {initial}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl"
            isDisabled={uploading}
            onPress={() => inputRef.current?.click()}
          >
            <ImagePlus size={14} />
            {hint ?? label}
          </Button>
          {value && onClear ? (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl text-[var(--danger)]"
              isDisabled={uploading}
              onPress={onClear}
            >
              <X size={14} />
            </Button>
          ) : null}
        </div>
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
