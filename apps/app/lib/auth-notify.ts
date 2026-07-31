const AUTH_REDIRECT_LOCK_KEY = '__app_auth_redirect_lock__';

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

export async function logoutWithNotification(): Promise<void> {
  if (isRedirectLocked()) return;
  lockRedirect();

  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    /* proceed to login even if logout request fails */
  }

  window.location.href = '/login?session=logout';
}

export function notifySessionExpiredAndRedirect(): void {
  if (typeof window === 'undefined') return;
  if (!window.location.pathname.startsWith('/app')) return;
  if (isRedirectLocked()) return;
  lockRedirect();

  const next = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/login?session=expired&next=${encodeURIComponent(next)}`;
}
