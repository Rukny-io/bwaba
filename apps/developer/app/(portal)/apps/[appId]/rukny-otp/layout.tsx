import type { ReactNode } from 'react';
import { requireProductInstalled } from '@/lib/dal';

export default async function RuknyOtpLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireProductInstalled(appId, 'ruknyOtp');
  return children;
}
