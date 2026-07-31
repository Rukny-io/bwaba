export interface StoreStats {
  hasStore: boolean;
  storeId?: string;
  storeName?: string;
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  featuredProducts: number;
  lowStock: number;
}

export interface WeeklySalesDay {
  day: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  price: number;
  image: string | null;
  ordersCount: number;
  status?: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  quantity: number;
  status: string;
}

export interface StoreOrderSummary {
  id: string;
  orderNumber?: string | null;
  status: string;
  total: number;
  currency?: string;
  createdAt: string;
  customerName?: string | null;
  itemsCount?: number;
}

export interface CommerceSnapshot {
  storeStats: StoreStats;
  orderStats: OrderStats;
  productStats: ProductStats;
  weeklySales: WeeklySalesDay[];
  topProducts: TopProduct[];
  recentOrders: StoreOrderSummary[];
  lowStockProducts: LowStockProduct[];
}

const EMPTY_STORE: StoreStats = {
  hasStore: false,
  totalProducts: 0,
  activeProducts: 0,
  outOfStock: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

const EMPTY_ORDERS: OrderStats = {
  totalOrders: 0,
  pendingOrders: 0,
  processingOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
};

const EMPTY_PRODUCTS: ProductStats = {
  totalProducts: 0,
  activeProducts: 0,
  outOfStock: 0,
  featuredProducts: 0,
  lowStock: 0,
};

export const EMPTY_COMMERCE: CommerceSnapshot = {
  storeStats: EMPTY_STORE,
  orderStats: EMPTY_ORDERS,
  productStats: EMPTY_PRODUCTS,
  weeklySales: [],
  topProducts: [],
  recentOrders: [],
  lowStockProducts: [],
};
