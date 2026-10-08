export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderPaymentMethod = 'CASH' | 'QASEH_CARD' | 'BANK_TRANSFER';

export type OrderPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
}

export interface StoreOrder {
  id: string;
  orderNumber?: string | null;
  status: OrderStatus | string;
  total: number;
  currency?: string;
  createdAt: string;
  itemsCount?: number;
  customer?: {
    id?: string;
    email?: string;
    name?: string | null;
    avatar?: string | null;
  } | null;
  phoneNumber?: string | null;
  paymentMethod?: OrderPaymentMethod | string;
  paymentStatus?: OrderPaymentStatus | string;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  customerNote?: string | null;
  storeNote?: string | null;
  cancellationReason?: string | null;
  items?: StoreOrderItem[];
  address?: StoreOrderAddress | null;
  coupon?: { code: string } | null;
}

export interface StoreOrderItem {
  id: string;
  productId?: string | null;
  productName: string;
  productNameAr?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string | null;
  variantAttributes?: Record<string, unknown> | null;
}

export interface StoreOrderAddress {
  fullName?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
  buildingNo?: string | null;
  floor?: string | null;
  apartmentNo?: string | null;
  landmark?: string | null;
}

export type OrderPaymentFilter = 'all' | 'PAID' | 'UNPAID';

export interface FetchStoreOrdersParams {
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
