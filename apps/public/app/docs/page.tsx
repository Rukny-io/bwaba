import type { Metadata } from 'next';
import { PublicAgDocsView } from '@/components/marketing/public-ag-docs-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';

export const metadata: Metadata = {
  title: 'الوثائق — ركني',
  description: 'أدلة البدء لإعداد المتجر، النماذج، الملف الشخصي، والتحليلات على ركني.',
};

export default function DocsPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgDocsView />
      </main>
    </PublicMarketingShell>
  );
}
