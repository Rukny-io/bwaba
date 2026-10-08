'use client';

import { cn } from '@/lib/utils';
import { useHorizontalDragScroll } from '@/lib/use-horizontal-drag-scroll';
import type { ProductDiscount } from '@/lib/discounts/types';
import {
  DiscountStripItem,
  DiscountStripItemSkeleton,
} from '@/components/products/discounts/discount-strip-item';
import { useTranslations } from '@/lib/i18n';

interface DiscountStripProps {
  discounts: ProductDiscount[];
  selectedDiscountId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onEdit: (discount: ProductDiscount) => void;
  className?: string;
}

export function DiscountStrip({
  discounts,
  selectedDiscountId,
  loading = false,
  onSelect,
  onEdit,
  className,
}: DiscountStripProps) {
  const { t } = useTranslations();
  const { ref, bind, isDragging, canScrollStart, canScrollEnd } =
    useHorizontalDragScroll<HTMLDivElement>();

  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 start-0 z-[1] w-8 bg-gradient-to-l from-transparent to-[var(--surface)] transition-opacity duration-200',
          canScrollStart ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 end-0 z-[1] w-8 bg-gradient-to-r from-transparent to-[var(--surface)] transition-opacity duration-200',
          canScrollEnd ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={ref}

        {...bind}
        className={cn(
          '-mx-1 flex touch-pan-y gap-3.5 overflow-x-auto overscroll-x-contain py-1.5 ps-3 pe-2',
          '[-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:12px] sm:ps-4 sm:pe-3 [&::-webkit-scrollbar]:hidden',
          'select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <DiscountStripItemSkeleton key={index} />
          ))
        ) : discounts.length === 0 ? (
          <p className="cursor-default py-2 text-sm text-[var(--muted-foreground)]">
            {t('discounts.stripEmpty')}
          </p>
        ) : (
          discounts.map((discount) => (
            <DiscountStripItem
              key={discount.id}
              discount={discount}
              selected={discount.id === selectedDiscountId}
              onSelect={() => onSelect(discount.id)}
              onEdit={() => onEdit(discount)}
            />
          ))
        )}
      </div>
    </div>
  );
}
