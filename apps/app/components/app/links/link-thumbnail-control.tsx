'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import {
  importLinkLogoFromUrl,
  removeLinkThumbnail,
  uploadLinkThumbnail,
} from '@/lib/links/thumbnail-api';
import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import type { SocialLink } from '@/lib/links/types';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface LinkThumbnailControlProps {
  link: SocialLink;
  catalogType: LinkCatalogTypeId;
  disabled?: boolean;
  onUpdated: (link: SocialLink) => void;
  onError?: (message: string) => void;
  className?: string;
}

export function LinkThumbnailControl({
  link,
  catalogType,
  disabled = false,
  onUpdated,
  onError,
  className,
}: LinkThumbnailControlProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const thumbnailSrc = resolveMediaUrl(link.thumbnail);
  const hasCustomLogo = Boolean(thumbnailSrc);

  async function runAction(action: () => Promise<SocialLink>) {
    setBusy(true);
    try {
      const updated = await action();
      onUpdated(updated);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'تعذر تحديث الشعار');
    } finally {
      setBusy(false);
    }
  }

  function handleUpload(file: File) {
    void runAction(() => uploadLinkThumbnail(link.id, file));
  }

  return (
    <div
      className={cn('relative shrink-0', className)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Dropdown>
        <Button
          variant="ghost"
          isDisabled={disabled || busy}
          aria-label="تغيير شعار الرابط"
          className={cn(
            'group/thumb relative h-auto min-h-0 min-w-0 overflow-hidden rounded-xl p-0',
            'size-11 sm:size-12',
            'ring-1 ring-[var(--border)]',
            'hover:ring-[color-mix(in_srgb,var(--border)_50%,var(--foreground)_50%)]',
          )}
        >
          {hasCustomLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailSrc!}
              alt=""
              className="size-full object-contain bg-[var(--surface-secondary)] p-1.5"
            />
          ) : (
            <LinkPlatformIconBadge type={catalogType} size="md" />
          )}

          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/45 text-white',
              'opacity-0 transition-opacity group-hover/thumb:opacity-100',
              busy && 'opacity-100',
            )}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-4" aria-hidden />
            )}
          </span>
        </Button>

        <Dropdown.Popover placement="bottom start">
          <Dropdown.Menu
            onAction={(key) => {
              if (key === 'import') {
                void runAction(() => importLinkLogoFromUrl(link.id, link.url));
                return;
              }
              if (key === 'upload') {
                fileInputRef.current?.click();
                return;
              }
              if (key === 'remove' && hasCustomLogo) {
                void runAction(() => removeLinkThumbnail(link.id));
              }
            }}
          >
            <Dropdown.Item id="import" textValue="استيراد من الموقع">
              <Sparkles className="size-4 shrink-0 text-muted" aria-hidden />
              <Label>استيراد من الموقع</Label>
            </Dropdown.Item>
            <Dropdown.Item id="upload" textValue="رفع شعار">
              <Upload className="size-4 shrink-0 text-muted" aria-hidden />
              <Label>رفع صورة أو SVG</Label>
            </Dropdown.Item>
            {hasCustomLogo ? (
              <Dropdown.Item id="remove" variant="danger" textValue="إزالة الشعار">
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <Label>إزالة الشعار</Label>
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.svg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
