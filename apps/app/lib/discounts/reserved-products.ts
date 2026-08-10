import { formatDiscountLabel } from '@/lib/discounts/api';
import type { ProductDiscount } from '@/lib/discounts/types';

export interface ReservedProductDiscount {
  discountId: string;
  percentage: number;
  label: string;
}

export function buildReservedProductMap(
  discounts: ProductDiscount[],
  excludeDiscountId?: string,
): Map<string, ReservedProductDiscount> {
  const map = new Map<string, ReservedProductDiscount>();

  for (const discount of discounts) {
    if (excludeDiscountId && discount.id === excludeDiscountId) continue;

    for (const productId of discount.productIds) {
      map.set(productId, {
        discountId: discount.id,
        percentage: discount.percentage,
        label: formatDiscountLabel(discount.percentage),
      });
    }
  }

  return map;
}
