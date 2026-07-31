import { api } from '@/lib/api-client';
import { getCommerceSnapshot } from '@/lib/commerce/api';
import type { CommerceSnapshot } from '@/lib/commerce/types';
import { normalizeAnalyticsOverview, type AnalyticsOverview } from '@/lib/analytics/types';
import { fetchMyLinks } from '@/lib/links/api';
import type { SocialLink } from '@/lib/links/types';

export interface FullAppAnalytics {
  analytics: AnalyticsOverview;
  commerce: CommerceSnapshot;
  links: SocialLink[];
}

export async function getFullAppAnalytics(days = 30): Promise<FullAppAnalytics> {
  const [overviewRes, commerce, links] = await Promise.all([
    api.get<Record<string, unknown>>('/analytics/overview', { days }),
    getCommerceSnapshot(),
    fetchMyLinks().catch(() => [] as SocialLink[]),
  ]);

  return {
    analytics: normalizeAnalyticsOverview(overviewRes.data),
    commerce,
    links,
  };
}

export async function getAnalyticsOverview(days = 30): Promise<AnalyticsOverview> {
  const { data } = await api.get<Record<string, unknown>>('/analytics/overview', { days });
  return normalizeAnalyticsOverview(data);
}

export async function getMyLinksForAnalytics(): Promise<SocialLink[]> {
  return fetchMyLinks();
}
