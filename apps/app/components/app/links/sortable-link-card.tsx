'use client';

import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import {
  Eye,
  EyeOff,
  MoreVertical,
  MousePointerClick,
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

function DragHandleDots({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <circle cx="5.5" cy="3.5" r="1.2" />
      <circle cx="10.5" cy="3.5" r="1.2" />
      <circle cx="5.5" cy="8" r="1.2" />
      <circle cx="10.5" cy="8" r="1.2" />
      <circle cx="5.5" cy="12.5" r="1.2" />
      <circle cx="10.5" cy="12.5" r="1.2" />
    </svg>
  );
}

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
  const isBlock = catalogType === 'header' || catalogType === 'text';

  function openDetail() {
    router.push(`/app/links/${link.id}`);
  }

  const cardClassName = cn(
    'dashboard-card group relative list-none',
    'flex items-center gap-1 sm:gap-1.5',
    'rounded-[1.75rem] p-2.5 sm:rounded-4xl sm:p-3',
    'transition-[box-shadow,border-color,opacity,background-color] duration-200',
    'hover:border-[color-mix(in_srgb,var(--border)_50%,var(--primary)_50%)]',
    'hover:shadow-[var(--card-shadow-hover)]',
    isHidden &&
      'border-dashed opacity-60 hover:opacity-80',
    link.isPinned &&
      'border-[color-mix(in_srgb,var(--primary)_38%,var(--border)_62%)] bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface)_95%)]',
  );

  const content = (
    <>
      {link.isPinned ? (
        <span
          className="absolute inset-y-5 start-1.5 w-1 rounded-full bg-[var(--primary)]"
          aria-hidden
        />
      ) : null}

      {sortable ? (
        <button
          type="button"
          className={cn(
            'flex h-11 w-7 shrink-0 touch-none cursor-grab items-center justify-center self-center',
            'rounded-xl text-[var(--muted-foreground)]/45',
            'transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
            'active:cursor-grabbing sm:h-12 sm:w-8',
          )}
          onPointerDown={(e) => {
            e.stopPropagation();
            dragControls.start(e);
          }}
          aria-label="اسحب لإعادة الترتيب"
        >
          <DragHandleDots className="size-4" />
        </button>
      ) : null}

      <button
        type="button"
        onClick={openDetail}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.35rem] px-1 py-0.5 text-start sm:gap-3.5"
      >
        <div className="relative shrink-0">
          {link.thumbnail ? (
            <div className="size-12 overflow-hidden rounded-2xl ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.thumbnail}
                alt=""
                className="size-full object-cover"
              />
            </div>
          ) : (
            <LinkPlatformIconBadge
              type={catalogType}
              size="lg"
              className="ring-1 ring-inset ring-black/[0.06] dark:ring-white/[0.08]"
            />
          )}
          {link.isPinned ? (
            <span className="absolute -bottom-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm ring-2 ring-[var(--surface)]">
              <Pin className="size-2.5 fill-current" />
            </span>
          ) : (
            <span
              className={cn(
                'absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full ring-2 ring-[var(--surface)]',
                isHidden ? 'bg-[var(--muted-foreground)]/45' : 'bg-[var(--success)]',
              )}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[14px] font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-[15px]">
              {label}
            </p>
            {isHidden ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)]">
                <EyeOff className="size-2.5" />
                مخفي
              </span>
            ) : null}
            {layoutLabel ? (
              <span className="hidden shrink-0 rounded-full bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted-foreground)] sm:inline-flex">
                {layoutLabel}
              </span>
            ) : null}
          </div>

          {!isBlock ? (
            <p
              className="mt-0.5 truncate text-[11px] text-[var(--muted-foreground)] sm:mt-1 sm:text-xs"
              dir="ltr"
            >
              {hostLabel}
            </p>
          ) : null}
        </div>

        {!isBlock ? (
          <div className="flex shrink-0 flex-col items-end gap-0.5 pe-0.5 sm:min-w-[3.25rem]">
            <span
              className="flex items-center gap-1 text-[13px] font-semibold tabular-nums leading-none text-[var(--foreground)] sm:text-[15px]"
              dir="ltr"
              lang="en"
            >
              <MousePointerClick className="hidden size-3.5 text-[var(--muted-foreground)]/70 sm:block" />
              {formatNumber(link.totalClicks)}
            </span>
            <span className="text-[9px] font-medium text-[var(--muted-foreground)] sm:text-[10px]">
              نقرة
            </span>
          </div>
        ) : null}
      </button>

      <div
        className="flex shrink-0 items-center gap-0.5 pe-0.5 sm:gap-1"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          role="switch"
          aria-checked={!isHidden}
          aria-label={isHidden ? 'إظهار الرابط' : 'إخفاء الرابط'}
          disabled={isBusy}
          onClick={() => onToggleStatus(link)}
          className={cn(
            'relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]',
            'disabled:opacity-50',
            isHidden
              ? 'bg-[var(--surface-secondary)]'
              : 'bg-[var(--primary)]',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-200',
              isHidden ? 'inset-inline-start-0.5' : 'inset-inline-start-[1.125rem]',
            )}
          />
        </button>

        <Dropdown>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="المزيد"
            isDisabled={isBusy}
            className="size-8 rounded-full sm:size-9"
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
        scale: 1.02,
        boxShadow: '0 16px 48px rgba(15, 23, 42, 0.14)',
        zIndex: 20,
      }}
    >
      {content}
    </Reorder.Item>
  );
}
