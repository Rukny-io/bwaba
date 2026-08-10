'use client';

import { cn } from '@/lib/utils';
import type { ProductDiscount } from '@/lib/discounts/types';
import {
  DiscountStripItem,
  DiscountStripItemSkeleton,
} from '@/components/products/discounts/discount-strip-item';

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
  return (
    <div
      className={cn(
        'flex gap-3.5 overflow-x-auto overscroll-x-contain px-0.5 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:6px] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <DiscountStripItemSkeleton key={index} />
        ))
      ) : discounts.length === 0 ? (
        <p className="py-2 text-[13px] text-[var(--muted-foreground)]">
          لا توجد خصومات بعد. اضغط «إضافة خصم» للبدء.
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
  );
}
