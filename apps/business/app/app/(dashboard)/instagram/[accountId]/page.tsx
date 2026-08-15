import { InstagramAccountDetailPanel } from '@/components/instagram/instagram-account-detail-panel';

type PageProps = {
  params: Promise<{ accountId: string }>;
};

export default async function InstagramAccountPage({ params }: PageProps) {
  const { accountId } = await params;
  return <InstagramAccountDetailPanel connectionId={accountId} />;
}
