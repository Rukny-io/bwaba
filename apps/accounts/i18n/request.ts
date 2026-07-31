import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import ar from '../messages/ar.json';
import en from '../messages/en.json';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "ar";
  const messages = locale === "en" ? en : ar;
  return { locale, messages };
});
