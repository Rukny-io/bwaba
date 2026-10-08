import { api } from '@/lib/api-client';
import type {
  FetchStoreOrdersParams,
  OrderStats,
  StoreOrder,
} from '@/lib/orders/types';

export async function fetchOrderStats(): Promise<OrderStats> {
  const response = await api.get<OrderStats>('/orders/store/stats');
  return response.data;
}

export async function fetchStoreOrders(
  params: FetchStoreOrdersParams = {},
): Promise<StoreOrder[]> {
  const response = await api.get<StoreOrder[]>('/orders/store/orders', {
    status: params.status,
    paymentStatus: params.paymentStatus,
    search: params.search?.trim() || undefined,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page,
    limit: params.limit,
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchStoreOrder(orderId: string): Promise<StoreOrder> {
  const response = await api.get<StoreOrder>(
    `/orders/store/orders/${encodeURIComponent(orderId)}`,
  );
  return response.data;
}
