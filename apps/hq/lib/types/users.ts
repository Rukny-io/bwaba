import type { UsersStats } from '@/lib/types/admin';

export type UserRole = 'ADMIN' | 'PREMIUM' | 'BASIC' | 'GUEST';

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  profileCompleted: boolean;
  twoFactorEnabled: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  verificationLevel: number;
  isRuknyVerified: boolean;
  isDeactivated: boolean;
  subscriptionPlan: string;
  lastLoginAt: string | null;
  createdAt: string;
  accountType: string;
  hasGoogle: boolean;
  name: string | null;
  username: string | null;
  avatar: string | null;
  eventsCount: number;
  formsCount: number;
  ordersCount: number;
  sessionsCount: number;
  postsCount: number;
}

export interface UsersListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | '';
  emailVerified?: '' | 'true' | 'false';
  startDate?: string;
  endDate?: string;
  verificationLevel?: '' | '0' | '1' | '2' | '3';
  isRuknyVerified?: '' | 'true' | 'false';
  twoFactorEnabled?: '' | 'true' | 'false';
  phoneVerified?: '' | 'true' | 'false';
  isDeactivated?: '' | 'true' | 'false';
}

export interface AdminUserProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  visibility: string;
  storageUsed: number;
  storageLimit: number;
}

export interface AdminUserStore {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  status: string;
}

export interface AdminUserSession {
  id: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  lastActivity: string;
  createdAt: string;
}

export interface AdminUserSecurityLog {
  id: string;
  action: string;
  status: string;
  description?: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  profileCompleted: boolean;
  twoFactorEnabled: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  accountType: string;
  hasGoogle: boolean;
  hasLinkedin: boolean;
  hasTelegram: boolean;
  telegramUsername?: string;
  lastLoginAt: string | null;
  verificationLevel: number;
  isRuknyVerified: boolean;
  ruknyVerifiedAt: string | null;
  isDeactivated: boolean;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: AdminUserProfile | null;
  store: AdminUserStore | null;
  sessions: AdminUserSession[];
  securityLogs: AdminUserSecurityLog[];
  counts: {
    events: number;
    forms: number;
    orders: number;
    posts: number;
    sessions: number;
    followers: number;
    following: number;
    reviews: number;
    comments: number;
    files: number;
  };
}

export interface UsersExportResponse {
  data: Record<string, unknown>[];
  total: number;
}

export interface AdminUserNote {
  id: string;
  note: string;
  adminId: string | null;
  createdAt: string;
}

export interface AdminUserActivityItem {
  id: string;
  action: string;
  status: string;
  description: string;
  adminId: string | null;
  type: string;
  createdAt: string;
}

export type { UsersStats };
