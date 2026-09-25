import type { Metadata } from 'next';
import { PublicAgDevelopersView } from '@/components/marketing/public-ag-developers-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';

export const metadata: Metadata = {
  title: 'المطورون — ركني',
  description: 'Webhooks، واجهات برمجية، وتضمين — اربط ركني بتطبيقاتك.',
};

export default function DevelopersPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgDevelopersView />
      </main>
    </PublicMarketingShell>
  );
}
