'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMyUsage, type UsageSummary } from '@/lib/api/subscriptions';

export function usePlanUsage() {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getMyUsage();
      setData(res);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحميل الاستخدام');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
