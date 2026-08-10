import { api } from '@/lib/api-client';
import type {
  CreateProductDiscountInput,
  ProductDiscount,
  UpdateProductDiscountInput,
} from '@/lib/discounts/types';

const BASE = '/stores/my-store/discounts';

export async function fetchDiscounts(
  includeInactive = false,
): Promise<ProductDiscount[]> {
  const { data } = await api.get<ProductDiscount[]>(BASE, {
    includeInactive: includeInactive ? 'true' : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchDiscount(id: string): Promise<ProductDiscount> {
  const { data } = await api.get<ProductDiscount>(`${BASE}/${id}`);
  return data;
}

export async function createDiscount(
  input: CreateProductDiscountInput,
): Promise<ProductDiscount> {
  const { data } = await api.post<ProductDiscount>(BASE, input);
  return data;
}

export async function updateDiscount(
  id: string,
  input: UpdateProductDiscountInput,
): Promise<ProductDiscount> {
  const { data } = await api.put<ProductDiscount>(`${BASE}/${id}`, input);
  return data;
}

export async function deleteDiscount(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function toggleDiscountActive(id: string): Promise<ProductDiscount> {
  const { data } = await api.put<ProductDiscount>(`${BASE}/${id}/toggle-active`);
  return data;
}

export function formatDiscountLabel(percentage: number): string {
  return `خصم ${percentage}%`;
}

export function calculateDiscountedPrice(
  price: number | string,
  percentage: number,
): number {
  const base = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(base)) return 0;
  return Math.max(0, Math.round(base * (1 - percentage / 100)));
}
