import { api } from '@/lib/api-client';
import type { OrderPaymentStatus, OrderStatus } from '@/lib/orders/types';

export type BulkActionResult = {
  updated: string[];
  failed: Array<{ id: string; reason: string }>;
  skipped: string[];
};

export type BulkDeleteResult = {
  deleted: string[];
  failed: Array<{ id: string; reason: string }>;
  skipped: string[];
};

export function isMockOrderId(orderId: string): boolean {
  return orderId.startsWith('mock-');
}

function splitMockIds(orderIds: string[]) {
  const skipped = orderIds.filter(isMockOrderId);
  const realIds = orderIds.filter((id) => !isMockOrderId(id));
  return { realIds, skipped };
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
): Promise<BulkActionResult> {
  const { realIds, skipped } = splitMockIds(orderIds);
  if (realIds.length === 0) {
    return { updated: [], failed: [], skipped };
  }

  const response = await api.put<BulkActionResult>('/orders/store/orders/bulk/status', {
    orderIds: realIds,
    status,
  });

  return {
    updated: response.data.updated ?? [],
    failed: response.data.failed ?? [],
    skipped,
  };
}

export async function bulkUpdatePaymentStatus(
  orderIds: string[],
  paymentStatus: Extract<OrderPaymentStatus, 'PAID' | 'UNPAID'>,
): Promise<BulkActionResult> {
  const { realIds, skipped } = splitMockIds(orderIds);
  if (realIds.length === 0) {
    return { updated: [], failed: [], skipped };
  }

  const response = await api.put<BulkActionResult>(
    '/orders/store/orders/bulk/payment-status',
    {
      orderIds: realIds,
      paymentStatus,
    },
  );

  return {
    updated: response.data.updated ?? [],
    failed: response.data.failed ?? [],
    skipped,
  };
}

export async function bulkDeleteOrders(
  orderIds: string[],
): Promise<BulkDeleteResult> {
  const { realIds, skipped } = splitMockIds(orderIds);
  if (realIds.length === 0) {
    return { deleted: [], failed: [], skipped };
  }

  const response = await api.delete<{
    deleted: string[];
    failed: Array<{ id: string; reason: string }>;
  }>('/orders/store/orders/bulk', {
    data: { orderIds: realIds },
  });

  return {
    deleted: response.data.deleted ?? [],
    failed: response.data.failed ?? [],
    skipped,
  };
}
