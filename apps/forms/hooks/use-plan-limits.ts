'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMySubscription,
  pickFormsPlanLimits,
  type PlanLimitsSnapshot,
  type SubscriptionDetails,
} from '@/lib/api/subscriptions';

export function usePlanLimits() {
  const [data, setData] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getMySubscription();
      setData(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل بيانات الخطة');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const limits: PlanLimitsSnapshot | null = data
    ? pickFormsPlanLimits(data.limits)
    : null;
  const plan = data?.plan ?? 'FREE';

  return { data, limits, plan, loading, error, refresh };
}
