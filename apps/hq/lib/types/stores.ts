export type StoreStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminStoreOwner {
  id: string;
  email: string;
  profile: {
    name: string | null;
    username: string | null;
    avatar: string | null;
  } | null;
}

export interface AdminStoreCategorySummary {
  id: string;
  name: string;
  nameAr: string;
  icon: string | null;
  color: string;
}

export interface AdminStoreCounts {
  products: number;
  orders: number;
  coupons: number;
}

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  status: StoreStatus;
  city: string | null;
  country: string | null;
  contactEmail: string | null;
  createdAt: string;
  user: AdminStoreOwner;
  store_categories: AdminStoreCategorySummary | null;
  _count: AdminStoreCounts;
}

export interface StoresListResponse {
  data: AdminStore[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StoresStatsCategoryBreakdown {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  count: number;
}

export interface StoresStatsCityBreakdown {
  city: string;
  count: number;
}

export interface StoresStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
  newThisWeek: number;
  totalProducts: number;
  totalOrders: number;
  byCategory: StoresStatsCategoryBreakdown[];
  byCity: StoresStatsCityBreakdown[];
}

export interface StoresListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: StoreStatus | '';
  categoryId?: string;
  city?: string;
}

export interface AdminStoreCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  icon: string | null;
  color: string;
  templateFields: unknown;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { stores: number };
}

export interface StoreCategoryPayload {
  name: string;
  nameAr: string;
  slug: string;
  description?: string | null;
  descriptionAr?: string | null;
  icon?: string | null;
  color?: string;
  templateFields?: unknown;
  order?: number;
  isActive?: boolean;
}

export interface AdminStoreProduct {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  salePrice?: string | number | null;
  status: string;
  productKind?: string;
  createdAt: string;
}

export interface AdminStoreOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: string | number;
  currency: string;
  createdAt: string;
}

export interface AdminStoreDetail {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  logo: string | null;
  banner: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: StoreStatus;
  address: string | null;
  city: string | null;
  country: string;
  categoryId: string | null;
  category: string | null;
  employeesCount: string | null;
  latitude: number | null;
  longitude: number | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  user: AdminStoreOwner;
  store_categories: AdminStoreCategory | null;
  products: AdminStoreProduct[];
  orders: AdminStoreOrder[];
  _count: AdminStoreCounts;
}
