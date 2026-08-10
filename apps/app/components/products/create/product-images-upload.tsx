'use client';

import { useId, useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { Chip, cn } from '@heroui/react';
import { ProductFormSection } from '@/components/products/create/product-form-section';

export interface PendingProductImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface ProductImagesUploadProps {
  images: PendingProductImage[];
  uploading?: boolean;
  onPick: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  maxImages?: number;
  className?: string;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const TILE_CLASS =
  'relative size-[6.75rem] shrink-0 overflow-hidden rounded-2xl sm:size-28';

export function ProductImagesUpload({
  images,
  uploading = false,
  onPick,
  onRemove,
  maxImages = 5,
  className,
}: ProductImagesUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const canAddMore = images.length < maxImages;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length) onPick(files);
  }

  function openPicker() {
    if (!uploading && canAddMore) {
      inputRef.current?.click();
    }
  }

  return (
    <ProductFormSection
      title="صور المنتج"
      description={
        images.length === 0
          ? `حتى ${maxImages} صور · JPEG, PNG, WebP`
          : undefined
      }
      className={className}
      contentClassName="gap-3"
    >
      <div className="flex items-center justify-end">
        <Chip size="sm" variant="soft">
          {images.length}/{maxImages}
        </Chip>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={uploading}
        onChange={handleChange}
      />

      <div className="flex flex-wrap items-start gap-2">
        {canAddMore ? (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className={cn(
              TILE_CLASS,
              'cursor-pointer border-0 bg-transparent p-0 text-start',
              uploading && 'pointer-events-none opacity-60',
            )}
          >
            <div className="flex size-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-2 text-center transition-colors hover:bg-surface-secondary/70">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-muted" />
              ) : (
                <>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                    <ImagePlus className="size-4" strokeWidth={1.5} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-tight text-muted sm:text-[11px]">
                    {images.length === 0 ? 'اضغط للرفع' : 'إضافة'}
                  </p>
                </>
              )}
            </div>
          </button>
        ) : null}

        {images.map((image, index) => (
          <div key={image.id} className={cn(TILE_CLASS, 'bg-surface-secondary')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt=""
              className="absolute inset-0 size-full object-cover"
            />
            {index === 0 ? (
              <Chip
                size="sm"
                variant="solid"
                className="absolute start-1.5 top-1.5 z-10 h-5 bg-black/55 text-[9px] text-white"
              >
                الرئيسية
              </Chip>
            ) : null}
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              className="absolute end-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/70"
              aria-label="إزالة الصورة"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
    </ProductFormSection>
  );
}
