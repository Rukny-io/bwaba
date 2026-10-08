import type { OrderStats, StoreOrder, StoreOrderItem } from '@/lib/orders/types';

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

const MOCK_PRODUCTS = [
  { name: 'تيشيرت قطني', variant: { size: 'L', color: 'أسود' } },
  { name: 'حقيبة جلدية', variant: { color: 'بني' } },
  { name: 'عطر خشبي 100مل', variant: null },
  { name: 'ساعة يد كلاسيكية', variant: { color: 'فضي' } },
];

function mockItems(orderId: string, count: number, total: number): StoreOrderItem[] {
  const shipping = 5_000;
  const perItem = Math.round((total - shipping) / count);
  return Array.from({ length: count }, (_, index) => {
    const product = MOCK_PRODUCTS[index % MOCK_PRODUCTS.length]!;
    return {
      id: `${orderId}-item-${index}`,
      productName: product.name,
      price: perItem,
      quantity: 1,
      subtotal: perItem,
      image: null,
      variantAttributes: product.variant,
    };
  });
}

function withDetails(order: StoreOrder): StoreOrder {
  const count = order.itemsCount ?? 1;
  return {
    ...order,
    subtotal: order.total - 5_000,
    shippingFee: 5_000,
    discount: 0,
    items: mockItems(order.id, count, order.total),
    address: {
      fullName: order.customer?.name ?? null,
      phoneNumber: order.phoneNumber ?? '+9647700000000',
      country: 'العراق',
      city: 'بغداد',
      district: 'الكرادة',
      street: 'شارع 62',
      buildingNo: '14',
      landmark: 'قرب مطعم الساعة',
    },
    customerNote: order.id === 'mock-1' ? 'يرجى الاتصال قبل التوصيل.' : null,
  };
}

const BASE_MOCK_ORDERS: StoreOrder[] = [
  {
    id: 'mock-1',
    orderNumber: '1042',
    status: 'PENDING',
    total: 45_000,
    currency: 'IQD',
    createdAt: hoursAgo(2),
    itemsCount: 2,
    customer: { name: 'أحمد علي' },
    phoneNumber: '+9647812345678',
    paymentMethod: 'CASH',
    paymentStatus: 'UNPAID',
  },
  {
    id: 'mock-2',
    orderNumber: '1041',
    status: 'PROCESSING',
    total: 128_000,
    currency: 'IQD',
    createdAt: hoursAgo(5),
    itemsCount: 3,
    customer: { name: 'سارة محمود', email: 'sara@example.com' },
    paymentMethod: 'QASEH_CARD',
    paymentStatus: 'PAID',
  },
  {
    id: 'mock-3',
    orderNumber: '1040',
    status: 'SHIPPED',
    total: 67_500,
    currency: 'IQD',
    createdAt: hoursAgo(18),
    itemsCount: 1,
    customer: { name: 'محمد حسين' },
    phoneNumber: '+9647709876543',
    paymentMethod: 'CASH',
    paymentStatus: 'UNPAID',
  },
  {
    id: 'mock-4',
    orderNumber: '1039',
    status: 'DELIVERED',
    total: 92_000,
    currency: 'IQD',
    createdAt: hoursAgo(30),
    itemsCount: 4,
    customer: { name: 'ليلى كاظم', email: 'layla@example.com' },
    paymentMethod: 'QASEH_CARD',
    paymentStatus: 'PAID',
  },
  {
    id: 'mock-5',
    orderNumber: '1038',
    status: 'PENDING',
    total: 34_000,
    currency: 'IQD',
    createdAt: hoursAgo(42),
    itemsCount: 1,
    customer: { name: 'عمر خالد' },
    phoneNumber: '+9647501122334',
    paymentMethod: 'QASEH_CARD',
    paymentStatus: 'UNPAID',
  },
  {
    id: 'mock-6',
    orderNumber: '1037',
    status: 'CANCELLED',
    total: 56_000,
    currency: 'IQD',
    createdAt: hoursAgo(72),
    itemsCount: 2,
    customer: { name: 'نور إبراهيم', email: 'noor@example.com' },
    paymentMethod: 'QASEH_CARD',
    paymentStatus: 'UNPAID',
  },
];

export const MOCK_ORDERS: StoreOrder[] = BASE_MOCK_ORDERS.map(withDetails);

export function findMockOrder(orderId: string): StoreOrder | null {
  if (process.env.NODE_ENV !== 'development') return null;
  return MOCK_ORDERS.find((order) => order.id === orderId) ?? null;
}

export const MOCK_ORDER_STATS: OrderStats = {
  totalOrders: 6,
  pendingOrders: 2,
  processingOrders: 1,
  completedOrders: 1,
  cancelledOrders: 1,
  totalRevenue: 366_500,
};

export function shouldUseMockOrders(
  orders: StoreOrder[],
  loading: boolean,
  noStore: boolean,
  error: string | null,
): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !loading &&
    !noStore &&
    !error &&
    orders.length === 0
  );
}

export function shouldUseMockStats(
  stats: OrderStats,
  statsLoading: boolean,
  noStore: boolean,
): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !statsLoading &&
    !noStore &&
    stats.totalOrders === 0
  );
}
