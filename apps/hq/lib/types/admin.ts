export interface PlatformStats {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  stores: { total: number; active: number };
  forms: { total: number; active: number };
  events: { total: number; active: number };
  orders: { total: number };
  mail: { total: number; active: number };
}

export interface UsersStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byRole: {
    admin: number;
    premium: number;
    basic: number;
    guest: number;
  };
  verified: number;
  profileCompleted: number;
  twoFactorEnabled: number;
  activeToday: number;
  verificationRate: number;
}

export interface OrdersStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: Record<string, number>;
  revenue: {
    total: number;
    thisMonth: number;
    today: number;
  };
  averageOrderValue: number;
  cancellationRate: number;
}

export interface VerificationStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byStatus: {
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
  approvalRate: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  environment: string;
  services: {
    database: { status: string; responseTime: number };
    redis: { status: string; responseTime: number };
  };
  memory: {
    used: number;
    total: number;
    rss: number;
  };
  latency: number;
}

export interface ActivityItem {
  id: string;
  type: 'user_signup' | 'store_created' | 'form_created' | 'event_created';
  title: string;
  subtitle: string;
  avatar?: string;
  createdAt: string;
}

export interface HqDashboardData {
  platform: PlatformStats;
  users: UsersStats;
  orders: OrdersStats;
  verification: VerificationStats;
  health: SystemHealth | null;
  commerce: CommerceAnalytics | null;
}

export type CommerceRange = '7d' | '30d' | '90d';

export interface CommerceTrendPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface TopStoreItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  orders: number;
  revenue: number;
}

export interface CommerceAnalytics {
  range: CommerceRange;
  revenueTrend: CommerceTrendPoint[];
  topStores: TopStoreItem[];
  totals: {
    orders: number;
    revenue: number;
  };
}
