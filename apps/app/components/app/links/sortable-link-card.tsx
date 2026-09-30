'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import {
  Eye,
  EyeOff,
  GripVertical,
  MoreVertical,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { LinkThumbnailControl } from '@/components/app/links/link-thumbnail-control';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import { formatNumber } from '@/lib/dashboard-format';
import {
  getLinkDisplayLabel,
  resolveCatalogTypeFromPlatform,
} from '@/lib/links/resolve-platform';
import type { SocialLink } from '@/lib/links/types';
import { cn } from '@/lib/utils';

interface SortableLinkCardProps {
  link: SocialLink;
  busyId: string | null;
  sortable?: boolean;
  onToggleStatus: (link: SocialLink) => void;
  onDelete: (link: SocialLink) => void;
  onLinkUpdated?: (link: SocialLink) => void;
  onThumbnailError?: (message: string) => void;
}

export function SortableLinkCard({
  link,
  busyId,
  sortable = true,
  onToggleStatus,
  onDelete,
  onLinkUpdated,
  onThumbnailError,
}: SortableLinkCardProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const catalogType = resolveCatalogTypeFromPlatform(link.platform);
  const label = getLinkDisplayLabel(link);
  const isHidden = link.status === 'hidden';
  const isBusy = busyId === link.id;
  const isBlock = catalogType === 'header' || catalogType === 'text';
  const shareUrl = link.shortUrl || link.url;

  const openDetail = useCallback(() => {
    router.push(`/app/links/${link.id}`);
  }, [link.id, router]);

  const handleShare = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: label, url: shareUrl });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard unavailable.
    }
  }, [label, shareUrl]);

  const cardClassName = cn(
    'group/link relative list-none w-full',
    'flex items-center gap-3 rounded-xl border p-4 sm:gap-4',
    'border-[var(--border)] bg-[var(--surface)]',
    'transition-[border-color,box-shadow,opacity,transform] duration-150',
    'hover:border-[color-mix(in_srgb,var(--border)_65%,var(--foreground)_35%)] hover:shadow-[0_2px_10px_rgba(15,23,42,0.06)]',
    isHidden && 'opacity-55 hover:opacity-70',
  );

  const content = (
    <>
      {sortable ? (
        <button
          type="button"
          className={cn(
            'absolute inset-y-0 start-0 z-[1] flex w-8 touch-none cursor-grab items-center justify-center',
            'text-[var(--muted-foreground)]/35 transition-opacity',
            'opacity-100 md:opacity-0 md:group-hover/link:opacity-100',
            'hover:text-[var(--muted-foreground)] active:cursor-grabbing',
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 sm:gap-4',
          sortable && 'ps-5 md:ps-6',
        )}
      >
        {!isBlock ? (
          <LinkThumbnailControl
            link={link}
            catalogType={catalogType}
            disabled={isBusy}
            onUpdated={(updated) => onLinkUpdated?.(updated)}
            onError={onThumbnailError}
          />
        ) : null}

        <button
          type="button"
          onClick={openDetail}
          className="flex min-w-0 flex-1 items-center gap-3 text-start sm:gap-4"
        >
          {isBlock ? <LinkPlatformIconBadge type={catalogType} size="md" /> : null}
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug text-[var(--foreground)] sm:text-base">
              {label}
            </p>
            {isBlock ? (
              <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)] sm:text-sm">
                كتلة نصية
              </p>
            ) : isHidden ? (
              <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)] sm:text-sm">
                مخفي
              </p>
            ) : null}
          </span>
        </button>
      </div>

      <div
        className="flex shrink-0 items-center gap-2"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!isBlock ? (
          <div
            className="flex h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-[var(--surface-secondary)] px-3 sm:h-12 sm:min-w-[3.5rem]"
            aria-label={`${formatNumber(link.totalClicks)} نقرة`}
          >
            <span className="text-sm font-bold tabular-nums leading-none text-[var(--foreground)] sm:text-base">
              {formatNumber(link.totalClicks)}
            </span>
            <span className="text-[10px] font-medium leading-none text-[var(--muted-foreground)]">
              نقرة
            </span>
          </div>
        ) : null}

        <Dropdown>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="خيارات الرابط"
            isDisabled={isBusy}
            className="size-8 rounded-full text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
          >
            <MoreVertical className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'edit') openDetail();
                if (key === 'share') void handleShare();
                if (key === 'toggle') void onToggleStatus(link);
                if (key === 'delete') void onDelete(link);
              }}
            >
              <Dropdown.Item id="edit" isDisabled={isBusy} textValue="تعديل">
                <Pencil className="size-4 shrink-0 text-muted" aria-hidden />
                <Label>تعديل</Label>
              </Dropdown.Item>
              <Dropdown.Item id="share" isDisabled={isBusy || isBlock} textValue="مشاركة">
                <Share2 className="size-4 shrink-0 text-muted" aria-hidden />
                <Label>مشاركة</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="toggle"
                isDisabled={isBusy}
                textValue={link.status === 'active' ? 'إخفاء' : 'إظهار'}
              >
                {link.status === 'active' ? (
                  <EyeOff className="size-4 shrink-0 text-muted" aria-hidden />
                ) : (
                  <Eye className="size-4 shrink-0 text-muted" aria-hidden />
                )}
                <Label>{link.status === 'active' ? 'إخفاء' : 'إظهار'}</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="delete"
                variant="danger"
                isDisabled={isBusy}
                textValue="حذف"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <Label>حذف</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </>
  );

  if (!sortable) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Reorder.Item
      value={link}
      dragListener={false}
      dragControls={dragControls}
      className={cardClassName}
      whileDrag={{
        scale: 1.01,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        zIndex: 20,
      }}
    >
      {content}
    </Reorder.Item>
  );
}
