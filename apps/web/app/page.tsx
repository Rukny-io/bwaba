import type { Metadata } from 'next';
import { PublicHomePage } from '@/components/marketing/public-home-page';

export const metadata: Metadata = {
  title: 'ركني — منصة واحدة لكل ما تحتاجه',
  description:
    'ركني للمتاجر الإلكترونية، النماذج الذكية، الملف الشخصي، والتحليلات. تزامن بيانات النماذج مع جداول جوجل عند ربط حساب جوجل.',
};

export default function Home() {
  return <PublicHomePage />;
}
