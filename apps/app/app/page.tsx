import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeJwt } from 'jose';
import { AUTH_COOKIE_NAMES } from '@/lib/auth-cookies';
import { DEFAULT_APP_PATH } from '@/lib/auth-redirect';

async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ||
    cookieStore.get('access_token')?.value;

  if (!token) return false;

  try {
    const payload = decodeJwt(token);
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default async function HomePage() {
  if (await hasValidSession()) {
    redirect(DEFAULT_APP_PATH);
  }

  redirect('/login');
}
