import { requireAppForUser } from '@/lib/dal';
import { WalletInvoicesPage } from '@/components/wallet/wallet-invoices-page';

export default async function WalletInvoicesRoute({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return (
    <section className="dashboard-page">
      <WalletInvoicesPage publicAppId={app.appId} />
    </section>
  );
}
