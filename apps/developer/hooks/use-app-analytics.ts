'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAppAnalytics,
  type AnalyticsPeriodDays,
} from '@/lib/api/analytics';

export function useAppAnalytics(
  publicAppId: string,
  days: AnalyticsPeriodDays,
) {
  return useQuery({
    queryKey: ['app-analytics', publicAppId, days],
    queryFn: () => getAppAnalytics(publicAppId, days),
    staleTime: 60_000,
  });
}
