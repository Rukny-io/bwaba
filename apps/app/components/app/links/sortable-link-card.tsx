'use client';

import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  GripVertical,
  MousePointerClick,
  MoreVertical,
  Pin,
  Trash2,
} from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import { formatNumber } from '@/lib/dashboard-format';
import {
  getLinkDisplayLabel,
  resolveCatalogTypeFromPlatform,
} from '@/lib/links/resolve-platform';
import type { LinkLayout, SocialLink } from '@/lib/links/types';
import { cn } from '@/lib/utils';

interface SortableLinkCardProps {
  link: SocialLink;
  busyId: string | null;
  sortable?: boolean;
  onToggleStatus: (link: SocialLink) => void;
  onDelete: (link: SocialLink) => void;
}

const LAYOUT_LABEL: Partial<Record<LinkLayout, string>> = {
  profile_card: 'بطاقة',
  media_grid: 'محتوى',
  featured: 'مميز',
};

export function SortableLinkCard({
  link,
  busyId,
  sortable = true,
  onToggleStatus,
  onDelete,
}: SortableLinkCardProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const catalogType = resolveCatalogTypeFromPlatform(link.platform);
  const label = getLinkDisplayLabel(link);
  const layoutLabel = LAYOUT_LABEL[link.layout ?? 'classic'];
  const hostLabel = (() => {
    try {
      return new URL(link.url).hostname.replace(/^www\./, '');
    } catch {
      return link.platform;
    }
  })();
  const isHidden = link.status === 'hidden';
  const isBusy = busyId === link.id;

  function openDetail() {
    router.push(`/app/links/${link.id}`);
  }

  const cardClassName = cn(
    'dashboard-card group relative list-none',
    'flex items-stretch gap-0.5 sm:gap-1',
    'rounded-3xl p-1.5 sm:rounded-[1.35rem] sm:p-2',
    'transition-[transform,box-shadow,border-color,opacity] duration-200',
    'hover:border-[color-mix(in_srgb,var(--border)_55%,var(--primary)_45%)]',
    'hover:shadow-[var(--card-shadow-hover)]',
    isHidden && 'opacity-55',
    link.isPinned &&
      'border-[color-mix(in_srgb,var(--primary)_35%,var(--border)_65%)] bg-[color-mix(in_srgb,var(--primary)_4%,var(--surface)_96%)]',
  );

  const content = (
    <>
      {link.isPinned ? (
        <span
          className="absolute inset-y-3 start-0 w-0.5 rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      ) : null}

      {sortable ? (
        <button
          type="button"
          className={cn(
            'flex w-7 shrink-0 touch-none cursor-grab items-center justify-center self-stretch',
            'rounded-2xl text-[var(--muted-foreground)]/70',
            'transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
            'active:cursor-grabbing sm:w-8',
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
          aria-label="اسحب لإعادة الترتيب"
        >
          <GripVertical className="size-4" strokeWidth={1.75} />
        </button>
      ) : null}

      <button
        type="button"
        onClick={openDetail}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-1 py-1.5 text-start transition-colors hover:bg-[var(--surface-secondary)]/60 sm:gap-3 sm:px-1.5 sm:py-2"
      >
        <div className="relative shrink-0">
          {link.thumbnail ? (
            <div className="size-11 overflow-hidden rounded-2xl ring-1 ring-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.thumbnail}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <LinkPlatformIconBadge type={catalogType} size="md" />
          )}
          {link.isPinned ? (
            <span className="absolute -bottom-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm ring-2 ring-[var(--surface)]">
              <Pin className="size-2.5 fill-current" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[13px] font-bold leading-tight text-[var(--foreground)] sm:text-[15px]">
              {label}
            </p>
            {isHidden ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                <EyeOff className="size-2.5" />
                مخفي
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className="truncate text-[11px] text-[var(--muted-foreground)] sm:text-xs"
              dir="ltr"
            >
              {hostLabel}
            </span>
            {layoutLabel ? (
              <>
                <span className="text-[var(--border)]" aria-hidden>
                  ·
                </span>
                <span className="shrink-0 rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                  {layoutLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-0.5 rounded-xl bg-[var(--surface-secondary)]/80 px-2 py-1.5 sm:min-w-[3.75rem] sm:px-2.5">
          <span
            className="flex items-center gap-1 text-[13px] font-bold tabular-nums leading-none text-[var(--foreground)] sm:text-sm"
            dir="ltr"
            lang="en"
          >
            <MousePointerClick className="hidden size-3 text-[var(--muted-foreground)] sm:block" />
            {formatNumber(link.totalClicks)}
          </span>
          <span className="text-[9px] font-medium text-[var(--muted-foreground)] sm:text-[10px]">
            نقرة
          </span>
        </div>

        <ChevronLeft
          className="hidden size-4 shrink-0 text-[var(--muted-foreground)]/50 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-[var(--foreground)] sm:block"
          aria-hidden
        />
      </button>

      <div
        className="relative shrink-0 self-center pe-0.5"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Dropdown>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="المزيد"
            isDisabled={isBusy}
            className="size-8 rounded-xl sm:size-9"
          >
            <MoreVertical className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'toggle') void onToggleStatus(link);
                if (key === 'delete') void onDelete(link);
              }}
            >
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
        scale: 1.015,
        boxShadow: '0 16px 48px rgba(15, 23, 42, 0.14)',
        zIndex: 20,
      }}
    >
      {content}
    </Reorder.Item>
  );
}
