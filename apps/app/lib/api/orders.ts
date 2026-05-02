/**
 * 📦 Orders API Functions (Server-side)
 * All calls use apiServer with httpOnly cookies.
 */

import { apiServer } from './server';

// ─── Types ─────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerInfo {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ShippingAddress {
  name?: string;
  phone?: string;
  phoneNumber?: string;
  city?: string;
  area?: string;
  district?: string;
  address?: string;
  fullName?: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAvatar?: string;
  customerEmail?: string;
  customer?: CustomerInfo;
  total: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  status: OrderStatus;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  notes?: string;
  storeNote?: string;
  estimatedDelivery?: string;
}

export interface OrdersResponse {
  orders: StoreOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

// ─── Raw backend response types ────────────────────────────────

interface RawOrderItem {
  id: string;
  productName?: string;
  productNameAr?: string;
  product?: { name?: string; product_images?: { imagePath: string }[] };
  image?: string;
  quantity?: number;
  price?: number;
  total?: number;
  subtotal?: number;
}

interface RawCustomer {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface RawAddress {
  fullName?: string;
  phoneNumber?: string;
  city?: string;
  district?: string;
  area?: string;
  address?: string;
  street?: string;
}

interface RawOrder {
  id: string;
  orderNumber?: string;
  status: string;
  total: number;
  subtotal?: number;
  shippingFee?: number;
  shippingCost?: number;
  discount?: number;
  paymentStatus?: string;
  createdAt: string;
  updatedAt?: string;
  customerNote?: string;
  storeNote?: string;
  estimatedDelivery?: string;
  notes?: string;
  items?: RawOrderItem[];
  order_items?: RawOrderItem[];
  customer?: RawCustomer;
  users?: { id?: string; email?: string; profile?: { name?: string; avatar?: string } };
  address?: RawAddress;
  addresses?: RawAddress;
  shippingAddress?: ShippingAddress;
  phoneNumber?: string;
}

interface RawOrdersResponse {
  orders: RawOrder[];
  total?: number;
  page?: number;
  limit?: number;
}

// ─── Status normalization ──────────────────────────────────────

const STATUS_MAP: Record<string, OrderStatus> = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

function normalizeStatus(raw: string): OrderStatus {
  return STATUS_MAP[raw.toUpperCase()] ?? 'PENDING';
}

// ─── Mapper ────────────────────────────────────────────────────

function mapOrder(raw: RawOrder): StoreOrder {
  // Extract customer info from various backend shapes
  const customer: CustomerInfo = {};
  if (raw.customer) {
    customer.id = raw.customer.id;
    customer.name = raw.customer.name;
    customer.email = raw.customer.email;
    customer.avatar = raw.customer.avatar;
  } else if (raw.users) {
    customer.id = raw.users.id;
    customer.email = raw.users.email;
    customer.name = raw.users.profile?.name;
    customer.avatar = raw.users.profile?.avatar;
  }

  // Extract address info — cast to any since backend sends varying shapes
  const addr = raw.address ?? raw.addresses ?? raw.shippingAddress;
  const a = addr as Record<string, unknown> | undefined;
  const shippingAddress: ShippingAddress | undefined = a ? {
    name: (a.fullName ?? a.name) as string | undefined,
    phone: (a.phoneNumber ?? a.phone) as string | undefined,
    city: a.city as string | undefined,
    area: (a.area ?? a.district) as string | undefined,
    address: (a.address ?? a.street) as string | undefined,
  } : undefined;

  // Customer name: prefer customer object, then address name
  const customerName = customer.name
    ?? shippingAddress?.name
    ?? (a?.fullName as string)
    ?? 'عميل';

  // Customer phone: prefer phoneNumber field, then address phone
  const customerPhone = raw.phoneNumber ?? shippingAddress?.phone ?? (a?.phoneNumber as string);

  // Map items from various backend shapes
  const rawItems = raw.items ?? raw.order_items ?? [];
  const items: OrderItem[] = rawItems.map((item) => ({
    id: item.id,
    productName: item.productNameAr ?? item.productName ?? item.product?.name ?? 'منتج',
    productImage: item.image ?? item.product?.product_images?.[0]?.imagePath,
    quantity: item.quantity ?? 1,
    price: Number(item.price) || 0,
    total: Number(item.subtotal ?? item.total ?? (item.price ?? 0) * (item.quantity ?? 1)) || 0,
  }));

  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.id.slice(0, 8),
    customerName,
    customerPhone,
    customerAvatar: customer.avatar,
    customerEmail: customer.email,
    customer,
    total: Number(raw.total) || 0,
    subtotal: Number(raw.subtotal ?? raw.total) || 0,
    shippingCost: Number(raw.shippingFee ?? raw.shippingCost) || 0,
    discount: Number(raw.discount) || 0,
    status: normalizeStatus(raw.status),
    paymentStatus: raw.paymentStatus,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    notes: raw.customerNote ?? raw.notes,
    storeNote: raw.storeNote,
    estimatedDelivery: raw.estimatedDelivery,
    shippingAddress,
    items,
  };
}

// ─── Functions ─────────────────────────────────────────────────

export async function getStoreOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<OrdersResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.status && params.status !== 'ALL') q.set('status', params.status);
  if (params?.search) q.set('search', params.search);

  const { data, error, status } = await apiServer<Record<string, unknown>>(
    `/orders/store/orders?${q.toString()}`,
  );

  console.log('[Orders API] GET /orders/store/orders', {
    status, error,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data as object) : null,
    isArray: Array.isArray(data),
    sample: JSON.stringify(data)?.slice(0, 400),
  });

  if (error || !data) {
    console.log('[Orders API] No data or error:', { error });
    return { orders: [], total: 0, page: 1, limit: 10 };
  }

  // Handle many possible response shapes from backend
  let rawOrders: RawOrder[] = [];
  let totalCount: number | undefined;

  const d = data as Record<string, unknown>;

  if (Array.isArray(d)) {
    // Direct array response
    rawOrders = d as unknown as RawOrder[];
  } else if (Array.isArray(d.orders)) {
    rawOrders = d.orders as RawOrder[];
    totalCount = safeNum(d.total) || undefined;
  } else if (Array.isArray(d.data)) {
    // { data: [...] }
    rawOrders = d.data as RawOrder[];
    totalCount = safeNum(d.total) || safeNum(d.count) || undefined;
  } else if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
    const nested = d.data as Record<string, unknown>;
    if (Array.isArray(nested.orders)) {
      // { data: { orders: [...] } }
      rawOrders = nested.orders as RawOrder[];
      totalCount = safeNum(nested.total) || safeNum(nested.count) || undefined;
    } else if (Array.isArray(nested.data)) {
      // { data: { data: [...] } }
      rawOrders = nested.data as RawOrder[];
      totalCount = safeNum(nested.total) || undefined;
    } else if (Array.isArray(nested.items)) {
      rawOrders = nested.items as RawOrder[];
      totalCount = safeNum(nested.total) || undefined;
    }
  } else if (Array.isArray(d.results)) {
    rawOrders = d.results as RawOrder[];
    totalCount = safeNum(d.total) || undefined;
  } else if (Array.isArray(d.items)) {
    rawOrders = d.items as RawOrder[];
    totalCount = safeNum(d.total) || undefined;
  }

  console.log('[Orders API] Parsed', rawOrders.length, 'orders, total:', totalCount);

  return {
    orders: rawOrders.map(mapOrder),
    total: totalCount ?? rawOrders.length,
    page: safeNum(d.page ?? (d.data as Record<string, unknown>)?.page) || params?.page || 1,
    limit: safeNum(d.limit ?? (d.data as Record<string, unknown>)?.limit) || params?.limit || 10,
  };
}

export async function getOrderDetails(orderId: string): Promise<StoreOrder | null> {
  // The backend single-order route is GET /orders/:id (not /orders/store/orders/:id)
  const { data, error } = await apiServer<Record<string, unknown>>(
    `/orders/${orderId}`,
  );

  if (error || !data) return null;

  // The API may return the order directly, or wrapped in various shapes
  let raw: RawOrder | null = null;

  if (typeof data === 'object' && data !== null) {
    if ('id' in data && 'status' in data) {
      // Direct order object
      raw = data as unknown as RawOrder;
    } else if ('order' in data && typeof data.order === 'object' && data.order !== null) {
      // Wrapped: { order: {...} }
      raw = data.order as RawOrder;
    } else if ('data' in data && typeof data.data === 'object' && data.data !== null) {
      // Wrapped: { data: {...} }
      const nested = data.data as Record<string, unknown>;
      if ('id' in nested && 'status' in nested) {
        raw = nested as unknown as RawOrder;
      } else if ('order' in nested && typeof nested.order === 'object' && nested.order !== null) {
        raw = nested.order as RawOrder;
      }
    }
  }

  if (!raw || !raw.id) return null;

  try {
    return mapOrder(raw);
  } catch {
    return null;
  }
}

const EMPTY_STATS: OrdersStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  processing: 0,
  shipped: 0,
  delivered: 0,
  completed: 0,
  cancelled: 0,
  totalRevenue: 0,
};

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function getOrdersStats(): Promise<OrdersStats> {
  // Try dedicated stats endpoint first
  try {
    const { data, error, status } = await apiServer<Record<string, unknown>>(
      '/orders/store/stats',
    );

    console.log('[Stats API] GET /orders/store/stats', { status, error, data: JSON.stringify(data)?.slice(0, 500) });

    if (!error && data && typeof data === 'object') {
      // Try to find the stats object — could be at data level, data.data, or data.stats
      let d = data as Record<string, unknown>;

      // Unwrap if nested: { data: { total: ... } } or { stats: { total: ... } }
      if (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) {
        d = d.data as Record<string, unknown>;
      } else if (d.stats && typeof d.stats === 'object') {
        d = d.stats as Record<string, unknown>;
      }

      // Check if we have something that looks like stats
      const hasStats = 'total' in d || 'totalOrders' in d || 'pending' in d || 'pendingOrders' in d || 'orderCount' in d;
      if (hasStats) {
        console.log('[Stats API] Found stats data:', JSON.stringify(d).slice(0, 300));
        return {
          total: safeNum(d.total ?? d.totalOrders ?? d.orderCount),
          pending: safeNum(d.pending ?? d.pendingOrders ?? d.pendingCount),
          confirmed: safeNum(d.confirmed ?? d.confirmedOrders),
          processing: safeNum(d.processing ?? d.processingOrders ?? d.processingCount),
          shipped: safeNum(d.shipped ?? d.shippedOrders),
          delivered: safeNum(d.delivered ?? d.deliveredOrders ?? d.completedOrders),
          completed: safeNum(d.completed ?? d.completedOrders),
          cancelled: safeNum(d.cancelled ?? d.cancelledOrders ?? d.canceledOrders),
          totalRevenue: safeNum(d.totalRevenue ?? d.revenue ?? d.totalSales),
        };
      }
    }
    console.log('[Stats API] Stats endpoint did not match expected format, falling back...');
  } catch (e) {
    console.log('[Stats API] Stats endpoint failed:', e);
    // fall through to fallback
  }

  // Fallback: fetch all orders and compute stats
  try {
    console.log('[Stats API] Falling back to computing from orders...');
    const ordersRes = await getStoreOrders({ limit: 1000 });
    const orders = ordersRes.orders;
    console.log('[Stats API] Fallback got', orders.length, 'orders');

    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === 'PENDING').length,
      confirmed: orders.filter((o) => o.status === 'CONFIRMED').length,
      processing: orders.filter((o) => o.status === 'PROCESSING').length,
      shipped: orders.filter((o) => o.status === 'SHIPPED').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
      cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
      totalRevenue: orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0),
    };
  } catch (e) {
    console.log('[Stats API] Fallback also failed:', e);
    return EMPTY_STATS;
  }
}
