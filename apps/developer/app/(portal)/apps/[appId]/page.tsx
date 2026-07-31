import { redirect } from 'next/navigation';
import { appDashboard } from '@/lib/app-routes';

export default async function AppIndexPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(appDashboard(appId));
}
