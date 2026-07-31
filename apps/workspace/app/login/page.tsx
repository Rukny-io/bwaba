import { redirect } from 'next/navigation';
import { ACCOUNTS_URL, WORKSPACE_URL } from '@/lib/config';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; session?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = `${WORKSPACE_URL.replace(/\/$/, '')}${next || '/app'}`;
  const accountsLogin = `${ACCOUNTS_URL.replace(/\/$/, '')}/login?return_to=${encodeURIComponent(returnTo)}`;
  redirect(accountsLogin);
}
