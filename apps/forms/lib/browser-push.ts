import { api } from '@/lib/api-client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function isBrowserPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getVapidPublicKey(): Promise<string | null> {
  const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (envKey) return envKey;

  try {
    const { data } = await api.get<{ publicKey: string | null }>(
      '/push-subscriptions/vapid-public-key',
    );
    return data.publicKey;
  } catch {
    return null;
  }
}

export async function subscribeBrowserPush(): Promise<{
  ok: boolean;
  reason?: 'unsupported' | 'denied' | 'no-vapid' | 'error';
}> {
  if (!isBrowserPushSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    return { ok: false, reason: 'no-vapid' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'denied' };
  }

  try {
    const registration = await navigator.serviceWorker.register('/push-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh) {
      return { ok: false, reason: 'error' };
    }

    await api.post('/push-subscriptions/subscribe', {
      endpoint: json.endpoint,
      keys: {
        auth: json.keys.auth,
        p256dh: json.keys.p256dh,
      },
    });

    return { ok: true };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function unsubscribeBrowserPush(): Promise<boolean> {
  if (!isBrowserPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return true;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await api.post('/push-subscriptions/unsubscribe', { endpoint });
    return true;
  } catch {
    return false;
  }
}

export async function hasActiveBrowserPushSubscription(): Promise<boolean> {
  if (!isBrowserPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}
