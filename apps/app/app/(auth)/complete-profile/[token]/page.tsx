import { CompleteProfileForm } from '@/components/auth/complete-profile-form';

export const metadata = {
  title: 'أكمل ملفك الشخصي | ركني',
};

// Disable all caching — this page must always be fresh
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string }>;
}

export default async function CompleteProfileTokenPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { s } = await searchParams;
  const step = parseInt(s ?? '1', 10);

  return <CompleteProfileForm token={token} initialStep={step} />;
}
