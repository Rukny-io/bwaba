/**
 * Dashboard API Functions (Server-side)
 * All calls use apiServer with httpOnly cookies.
 */

import { apiServer } from './server';

// ─── Types ─────────────────────────────────────────────────────

export interface StoreStats {
  hasStore: boolean;
  storeId?: string;
  storeName?: string;
  storeStatus?: string;
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface WeeklySalesDay {
  day: string;
  sales: number;
  orders: number;
}

export interface WeeklySales {
  days: WeeklySalesDay[];
}

export interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items?: { productName?: string; quantity?: number }[];
  shippingAddress?: {
    city?: string;
    name?: string;
  };
}

export interface OrdersResponse {
  orders: OrderItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ChartSummary {
  currentTotal: number;
  previousTotal: number;
  currentOrders: number;
  previousOrders: number;
}

export interface ChartData {
  current: WeeklySalesDay[];
  previous: WeeklySalesDay[];
  summary: ChartSummary;
}

// ─── Functions ─────────────────────────────────────────────────

export async function getStoreStats(): Promise<StoreStats> {
  const { data, error } = await apiServer<StoreStats>('/stores/stats');
  if (error || !data) {
    return {
      hasStore: false,
      totalProducts: 0,
      activeProducts: 0,
      outOfStock: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }
  return data;
}

export async function getWeeklySales(): Promise<WeeklySales> {
  const { data, error } = await apiServer<WeeklySales>('/stores/stats/weekly-sales');
  if (error || !data) return { days: [] };
  return data;
}

export async function getRecentOrders(limit = 5): Promise<OrderItem[]> {
  const { data, error } = await apiServer<{ orders: OrderItem[] }>(
    `/orders/store/orders?limit=${limit}`,
  );
  if (error || !data) return [];
  return data.orders ?? [];
}

export async function getChartData(): Promise<ChartData> {
  const { data, error } = await apiServer<ChartData>('/stores/stats/chart');
  if (error || !data) {
    return {
      current: [],
      previous: [],
      summary: { currentTotal: 0, previousTotal: 0, currentOrders: 0, previousOrders: 0 },
    };
  }
  return data;
}
