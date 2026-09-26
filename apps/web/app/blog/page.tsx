import type { Metadata } from 'next';
import { PublicAgBlogView } from '@/components/marketing/public-ag-blog-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return {
    title: messages.meta.blogTitle,
    description: messages.meta.blogDescription,
  };
}

export default function BlogPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgBlogView />
      </main>
    </PublicMarketingShell>
  );
}
