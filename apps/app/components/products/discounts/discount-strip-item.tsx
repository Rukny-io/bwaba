'use client';

import { memo } from 'react';
import { MoreVertical, Pause, Pencil, Play, Percent, Trash2 } from 'lucide-react';
import { Button, Dropdown, Label } from '@heroui/react';
import type { ProductDiscount } from '@/lib/discounts/types';
import { formatDiscountLabel } from '@/lib/discounts/api';
import { cn } from '@/lib/utils';

interface DiscountStripItemProps {
  discount: ProductDiscount;
  selected?: boolean;
  isBusy?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

function DiscountStripItemComponent({
  discount,
  selected = false,
  isBusy = false,
  onSelect,
  onEdit,
  onToggleActive,
  onDelete,
}: DiscountStripItemProps) {
  const title = formatDiscountLabel(discount.percentage);
  const productLabel =
    discount.productsCount === 1
      ? 'منتج واحد'
      : `${discount.productsCount} منتجات`;

  return (
    <div className="group flex w-[5.25rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5.75rem]">
      <div className="relative w-full">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="block w-full"
        >
          <div
            className={cn(
              'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 bg-[var(--primary)]/10 transition-colors duration-200',
              selected
                ? 'border-[var(--foreground)]'
                : 'border-transparent group-hover:border-[var(--border)]',
            )}
          >
            <Percent
              className="size-6 text-[var(--primary)] sm:size-[1.5rem]"
              strokeWidth={2}
              aria-hidden
            />

            {!discount.isActive ? (
              <span className="absolute start-1 top-1 size-1.5 rounded-full bg-amber-500 ring-1 ring-white" />
            ) : null}
          </div>
        </button>

        <div
          className="absolute end-1 top-1 z-10"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Dropdown>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`خيارات ${title}`}
              isDisabled={isBusy}
              className="size-7 rounded-full !bg-black/45 !text-white backdrop-blur-sm hover:!bg-black/60"
            >
              <MoreVertical className="size-3.5" />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'edit') queueMicrotask(() => onEdit?.());
                  if (key === 'toggle') onToggleActive?.();
                  if (key === 'delete') onDelete?.();
                }}
              >
                <Dropdown.Item id="edit" textValue="تعديل">
                  <Pencil className="size-4 shrink-0 text-muted" aria-hidden />
                  <Label>تعديل</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="toggle"
                  isDisabled={isBusy}
                  textValue={discount.isActive ? 'إيقاف الخصم' : 'تفعيل الخصم'}
                >
                  {discount.isActive ? (
                    <Pause className="size-4 shrink-0 text-muted" aria-hidden />
                  ) : (
                    <Play className="size-4 shrink-0 text-muted" aria-hidden />
                  )}
                  <Label>{discount.isActive ? 'إيقاف الخصم' : 'تفعيل الخصم'}</Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="delete"
                  variant="danger"
                  isDisabled={isBusy}
                  textValue="حذف الخصم"
                >
                  <Trash2 className="size-4 shrink-0" aria-hidden />
                  <Label>حذف الخصم</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'line-clamp-2 w-full text-center text-[11px] leading-snug sm:text-[12px]',
          selected
            ? 'font-semibold text-[var(--foreground)]'
            : 'font-medium text-[var(--muted-foreground)]',
        )}
        title={`${title} · ${productLabel}`}
      >
        {title}
      </button>
    </div>
  );
}

export function DiscountStripItemSkeleton() {
  return (
    <div className="flex w-[5.25rem] shrink-0 animate-pulse flex-col items-center gap-1.5 sm:w-[5.75rem]">
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-secondary)]/80" />
      <div className="h-2.5 w-[70%] rounded bg-[var(--surface-secondary)]/60" />
    </div>
  );
}

export const DiscountStripItem = memo(DiscountStripItemComponent);
