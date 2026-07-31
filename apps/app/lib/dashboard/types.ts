import type { AnalyticsOverview } from '@/lib/analytics/types';
import type { AppInsight } from '@/lib/analytics/insights';
import type { CommerceSnapshot } from '@/lib/commerce/types';
import type { SocialLink } from '@/lib/links/types';

export type { AnalyticsOverview };

export interface ProfileMe {
  username: string;
  name: string | null;
}

export interface DashboardHomeData {
  analytics: AnalyticsOverview;
  commerce: CommerceSnapshot;
  links: SocialLink[];
  insights: AppInsight[];
  profile: ProfileMe | null;
}
