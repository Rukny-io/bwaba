import { api } from '@/lib/api-client';
import {
  EMPTY_COMMERCE,
  type CommerceSnapshot,
  type LowStockProduct,
  type OrderStats,
  type ProductStats,
  type StoreOrderSummary,
  type StoreStats,
  type TopProduct,
  type WeeklySalesDay,
} from '@/lib/commerce/types';

interface TopProductsResponse {
  data: TopProduct[];
}

interface MyProductRow {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

interface StoreOrderRow {
  id: string;
  orderNumber?: string | null;
  status: string;
  total: number;
  currency?: string;
  createdAt: string;
  customer?: { name?: string | null };
  itemsCount?: number;
  _count?: { order_items: number };
}

export async function getCommerceSnapshot(): Promise<CommerceSnapshot> {
  const [
    storeStats,
    orderStats,
    productStats,
    weeklySalesRes,
    topProductsRes,
    recentOrdersRes,
    myProductsRes,
  ] = await Promise.all([
    api.get<StoreStats>('/stores/stats').catch(() => ({ data: EMPTY_COMMERCE.storeStats })),
    api.get<OrderStats>('/orders/store/stats').catch(() => ({ data: EMPTY_COMMERCE.orderStats })),
    api.get<ProductStats>('/products/stats').catch(() => ({ data: EMPTY_COMMERCE.productStats })),
    api
      .get<{ days: WeeklySalesDay[] }>('/stores/stats/weekly-sales')
      .catch(() => ({ data: { days: [] } })),
    api
      .get<TopProductsResponse>('/products/store/top', { limit: 5 })
      .catch(() => ({ data: { data: [] } })),
    api
      .get<StoreOrderRow[]>('/orders/store/orders', { limit: 5 })
      .catch(() => ({ data: [] })),
    api.get<MyProductRow[]>('/products/my-products').catch(() => ({ data: [] })),
  ]);

  const myProducts = Array.isArray(myProductsRes.data) ? myProductsRes.data : [];
  const lowStockProducts: LowStockProduct[] = myProducts
    .filter(
      (p) =>
        p.status === 'ACTIVE' &&
        typeof p.quantity === 'number' &&
        p.quantity > 0 &&
        p.quantity <= 5,
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      status: p.status,
    }));

  const recentOrders: StoreOrderSummary[] = (
    Array.isArray(recentOrdersRes.data) ? recentOrdersRes.data : []
  ).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    currency: order.currency,
    createdAt: order.createdAt,
    customerName: order.customer?.name,
    itemsCount: order.itemsCount ?? order._count?.order_items,
  }));

  return {
    storeStats: storeStats.data ?? EMPTY_COMMERCE.storeStats,
    orderStats: orderStats.data ?? EMPTY_COMMERCE.orderStats,
    productStats: productStats.data ?? EMPTY_COMMERCE.productStats,
    weeklySales: weeklySalesRes.data?.days ?? [],
    topProducts: topProductsRes.data?.data ?? [],
    recentOrders,
    lowStockProducts,
  };
}
