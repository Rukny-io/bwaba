const AUTH_REDIRECT_LOCK_KEY = '__dev_auth_redirect_lock__';

function isRedirectLocked(): boolean {
  if (typeof window === 'undefined') return true;
  return Boolean(
    (window as unknown as Record<string, boolean>)[AUTH_REDIRECT_LOCK_KEY],
  );
}

function lockRedirect(): void {
  if (typeof window === 'undefined') return;
  (window as unknown as Record<string, boolean>)[AUTH_REDIRECT_LOCK_KEY] = true;
}

const REDIRECT_DELAY_MS = 900;

export async function logoutWithNotification(): Promise<void> {
  if (isRedirectLocked()) return;
  lockRedirect();

  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    /* proceed */
  }

  const { appToast } = await import('@/lib/app-toast');
  appToast.success('تم تسجيل الخروج بنجاح');

  window.setTimeout(() => {
    window.location.href = '/login?session=logout';
  }, REDIRECT_DELAY_MS);
}

export function notifySessionExpiredAndRedirect(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/apps')) return;
  if (isRedirectLocked()) return;
  lockRedirect();

  const next = `${window.location.pathname}${window.location.search}`;

  void import('@/lib/app-toast').then(({ appToast }) => {
    appToast.info('انتهت جلستك. يرجى تسجيل الدخول مجدداً.');
  });

  window.setTimeout(() => {
    window.location.href = `/login?session=expired&next=${encodeURIComponent(next)}`;
  }, REDIRECT_DELAY_MS);
}
