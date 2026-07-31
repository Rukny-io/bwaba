'use server';

import { cookies } from 'next/headers';
import { Locale } from '@/lib/dictionary';

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}
