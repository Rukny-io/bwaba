import type { ReactNode } from 'react';
import { requireProductInstalled } from '@/lib/dal';
import { EmailApiChrome } from '@/components/email-api/email-api-chrome';

export default async function EmailApiLayout({ children, params }: { children: ReactNode; params: Promise<{ appId: string }> }) {
  const { appId } = await params;
  await requireProductInstalled(appId, 'emailApi');
  return <EmailApiChrome>{children}</EmailApiChrome>;
}
