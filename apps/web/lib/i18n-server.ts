import 'server-only';

import { cookies } from 'next/headers';
import { normalizeLocale, type AppLocale } from './i18n';

export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get('NEXT_LOCALE')?.value);
}
