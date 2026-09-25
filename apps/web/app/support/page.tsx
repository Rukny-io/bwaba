import type { Metadata } from 'next';
import { PublicAgSupportView } from '@/components/marketing/public-ag-support-view';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';

export const metadata: Metadata = {
  title: 'مركز المساعدة — ركني',
  description: 'أسئلة شائعة، روابط مفيدة، وقناة تواصل مع فريق ركني.',
};

export default function SupportPage() {
  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgSupportView />
      </main>
    </PublicMarketingShell>
  );
}
