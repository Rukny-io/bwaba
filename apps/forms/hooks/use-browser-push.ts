'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  hasActiveBrowserPushSubscription,
  isBrowserPushSupported,
  subscribeBrowserPush,
  unsubscribeBrowserPush,
} from '@/lib/browser-push';
import { useFormsPreferences } from '@/hooks/use-forms-preferences';
import { appToast } from '@/lib/app-toast';

export function useBrowserPush() {
  const { preferences, update } = useFormsPreferences();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setSupported(isBrowserPushSupported());
    if (!isBrowserPushSupported()) {
      setSubscribed(false);
      return;
    }
    setSubscribed(await hasActiveBrowserPushSubscription());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await subscribeBrowserPush();
      if (result.ok) {
        update({ browserPushEnabled: true });
        setSubscribed(true);
        appToast.success('تم تفعيل إشعارات المتصفح');
        return true;
      }

      if (result.reason === 'denied') {
        appToast.error('تم رفض إذن الإشعارات من المتصفح');
      } else if (result.reason === 'no-vapid') {
        appToast.error('إشعارات المتصفح غير مهيأة على الخادم');
      } else if (result.reason === 'unsupported') {
        appToast.error('المتصفح لا يدعم إشعارات الدفع');
      } else {
        appToast.error('تعذّر تفعيل إشعارات المتصفح');
      }
      return false;
    } finally {
      setBusy(false);
    }
  }, [update]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await unsubscribeBrowserPush();
      update({ browserPushEnabled: false });
      setSubscribed(false);
      appToast.info('تم إيقاف إشعارات المتصفح');
    } finally {
      setBusy(false);
    }
  }, [update]);

  const toggle = useCallback(
    async (next: boolean) => {
      if (next) return enable();
      await disable();
      return true;
    },
    [disable, enable],
  );

  return {
    supported,
    subscribed,
    busy,
    preferenceEnabled: preferences.browserPushEnabled,
    toggle,
    refresh,
  };
}
