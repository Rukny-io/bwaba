import { api } from '@/lib/api-client';

export type AnalyticsPeriodDays = 7 | 30 | 90;

export interface AppAnalyticsDailyPoint {
  date: string;
  messages: number;
  messagesDelivered: number;
  messagesFailed: number;
  apiRequests: number;
  formViews: number;
  formSubmissions: number;
  walletSpent: number;
}

export interface AppAnalyticsSummary {
  apiRequests: number;
  apiRequestsLifetime: number;
  apiRequestsTrend: number;
  messages: number;
  messagesDelivered: number;
  messagesFailed: number;
  messagesTrend: number;
  formViews: number;
  formSubmissions: number;
  formViewsTrend: number;
  formSubmissionsTrend: number;
  walletSpent: number;
  walletSpentTrend: number;
  walletBalance: number;
  walletCurrency: string;
  walletTotalAllocated: number;
  walletTotalSpent: number;
  activeApiKeys: number;
  totalApiKeys: number;
  linkedForms: number;
  whatsappAccounts: number;
}

export interface AppAnalyticsResponse {
  appId: string;
  appName: string;
  period: {
    days: AnalyticsPeriodDays;
    startDate: string;
    endDate: string;
  };
  summary: AppAnalyticsSummary;
  dailyTrend: AppAnalyticsDailyPoint[];
  messagesByStatus: Record<string, number>;
  messagesByType: Record<string, number>;
  messagesByDirection: Record<string, number>;
  topApiKeys: {
    id: string;
    name: string;
    slug: string;
    status: string;
    environment: string;
    requestCount: number;
    lastUsedAt: string | null;
  }[];
  topForms: {
    id: string;
    title: string;
    slug: string;
    status: string;
    views: number;
    submissions: number;
  }[];
}

export async function getAppAnalytics(
  appId: string,
  days: AnalyticsPeriodDays = 30,
): Promise<AppAnalyticsResponse> {
  const { data } = await api.get<AppAnalyticsResponse>(
    `/developer/apps/${appId}/analytics`,
    { days },
  );
  return data;
}
