import type { Metadata } from 'next';
import { PublicAgEnterpriseView } from '@/components/marketing/public-ag-enterprise-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = getMessages(locale);

  return {
    title: messages.meta.enterpriseTitle,
    description: messages.meta.enterpriseDescription,
  };
}

export default function EnterprisePage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgEnterpriseView />
      </main>
    </PublicMarketingShell>
  );
}
