/**
 * Store API Functions (Server-side)
 * All calls use apiServer with httpOnly cookies.
 */

import { apiServer } from './server';

// ─── Types ─────────────────────────────────────────────────────

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  logo?: string;
  description?: string;
  currency?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  image?: string;
  category?: string;
  totalSales?: number;
  createdAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface StoreAnalytics {
  totalProducts: number;
  activeProducts: number;
  hiddenProducts: number;
  outOfStock: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  weeklyVisitors: number;
  currentWeek: { day: string; revenue: number; orders: number; visitors: number }[];
  previousWeek: { day: string; revenue: number; orders: number; visitors: number }[];
  summary: {
    currentRevenue: number;
    previousRevenue: number;
    currentOrders: number;
    previousOrders: number;
    currentVisitors: number;
    previousVisitors: number;
  };
  topProducts: {
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
  }[];
}

// ─── Raw backend response types ────────────────────────────────

interface RawStoreStats {
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

interface RawWeeklySales {
  days: { day: string; sales: number; orders: number }[];
}

interface RawTopProduct {
  id: string;
  name: string;
  image?: string | null;
  ordersCount?: number;
  totalOrders?: number;
  sales?: number;
  revenue?: number;
  totalRevenue?: number;
}

interface RawTopProductsResponse {
  data: RawTopProduct[];
}

interface RawProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  stock: number;
  status: string;
  product_images?: { imagePath: string }[];
  product_categories?: { name: string }[];
  _count?: { order_items?: number };
  createdAt: string;
}

// ─── Functions ─────────────────────────────────────────────────

export async function getStoreInfo(): Promise<StoreInfo | null> {
  const { data, error } = await apiServer<StoreInfo>('/stores/my-store');
  if (error || !data) return null;
  return data;
}

export async function getStoreProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ProductsResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);

  const { data, error } = await apiServer<RawProduct[]>(
    `/products/my-products?${q.toString()}`,
  );

  if (error || !data || !Array.isArray(data)) {
    return { products: [], total: 0, page: 1, limit: 50 };
  }

  const statusMap: Record<string, Product['status']> = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    OUT_OF_STOCK: 'out_of_stock',
  };

  const products: Product[] = data.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : undefined,
    stock: p.stock ?? 0,
    status: statusMap[p.status] ?? 'inactive',
    image: p.product_images?.[0]?.imagePath,
    category: p.product_categories?.[0]?.name,
    totalSales: p._count?.order_items ?? 0,
    createdAt: p.createdAt,
  }));

  return { products, total: products.length, page: 1, limit: 50 };
}

export async function getStoreAnalytics(): Promise<StoreAnalytics> {
  const empty: StoreAnalytics = {
    totalProducts: 0,
    activeProducts: 0,
    hiddenProducts: 0,
    outOfStock: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    weeklyVisitors: 0,
    currentWeek: [],
    previousWeek: [],
    summary: {
      currentRevenue: 0,
      previousRevenue: 0,
      currentOrders: 0,
      previousOrders: 0,
      currentVisitors: 0,
      previousVisitors: 0,
    },
    topProducts: [],
  };

  const [statsRes, weeklyRes, topRes] = await Promise.all([
    apiServer<RawStoreStats>('/stores/stats'),
    apiServer<RawWeeklySales>('/stores/stats/weekly-sales'),
    apiServer<RawTopProductsResponse>('/products/store/top?limit=5'),
  ]);

  const stats = statsRes.data;
  const weekly = weeklyRes.data;
  const topList = topRes.data?.data ?? [];

  if (!stats) return empty;

  const currentWeek = (weekly?.days ?? []).map((d) => ({
    day: d.day,
    revenue: d.sales,
    orders: d.orders,
    visitors: 0,
  }));

  const currentRevenue = stats.totalRevenue;
  const currentOrders = stats.totalOrders;

  return {
    totalProducts: stats.totalProducts,
    activeProducts: stats.activeProducts,
    hiddenProducts: 0,
    outOfStock: stats.outOfStock,
    totalOrders: currentOrders,
    totalRevenue: currentRevenue,
    avgOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,
    conversionRate: 0,
    weeklyVisitors: 0,
    currentWeek,
    previousWeek: [],
    summary: {
      currentRevenue,
      previousRevenue: 0,
      currentOrders,
      previousOrders: 0,
      currentVisitors: 0,
      previousVisitors: 0,
    },
    topProducts: topList.map((p) => ({
      id: p.id,
      name: p.name,
      image: p.image ?? undefined,
      sales: p.ordersCount ?? p.totalOrders ?? p.sales ?? 0,
      revenue: p.totalRevenue ?? p.revenue ?? 0,
    })),
  };
}

