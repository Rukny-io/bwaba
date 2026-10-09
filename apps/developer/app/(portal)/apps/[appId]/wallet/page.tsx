import { requireAppForUser } from '@/lib/dal';
import { AppWalletPage } from '@/components/wallet/app-wallet-page';

export default async function WalletPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return (
    <section className="dashboard-page">
      <AppWalletPage publicAppId={app.appId} />
    </section>
  );
}
