import type { Metadata } from 'next';
import { PublicHomePage } from '@/components/marketing/public-home-page';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
  };
}

export default function Home() {
  return <PublicHomePage />;
}
