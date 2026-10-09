import { requireAppForUser } from '@/lib/dal';
import { WalletTopUpPage } from '@/components/wallet/wallet-top-up-page';

export default async function WalletTopUpRoute({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return (
    <section className="dashboard-page">
      <WalletTopUpPage publicAppId={app.appId} />
    </section>
  );
}
