import type { Metadata } from 'next';
import { PublicAgEnterpriseView } from '@/components/marketing/public-ag-enterprise-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';

export const metadata: Metadata = {
  title: 'المؤسسات — ركني',
  description:
    'حلول ركني للفرق والمؤسسات — صلاحيات، تكاملات، تحليلات متقدمة، ودعم مباشر.',
};

export default function EnterprisePage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgEnterpriseView />
      </main>
    </PublicMarketingShell>
  );
}
