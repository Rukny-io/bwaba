import { api } from '@/lib/api-client';
import type { OrderStatus } from '@/lib/orders/types';

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith('mock-');
}

export async function updateStoreOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<void> {
  await api.put(`/orders/${encodeURIComponent(orderId)}/status`, { status });
}

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus,
): Promise<{ updated: string[]; skipped: string[] }> {
  const skipped = orderIds.filter(isMockOrderId);
  const updated: string[] = [];

  for (const orderId of orderIds) {
    if (isMockOrderId(orderId)) continue;
    await updateStoreOrderStatus(orderId, status);
    updated.push(orderId);
  }

  return { updated, skipped };
}
