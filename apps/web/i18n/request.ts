import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { getMessages, normalizeLocale } from '../lib/i18n';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get('NEXT_LOCALE')?.value);
  const messages = getMessages(locale);

  return { locale, messages };
});
