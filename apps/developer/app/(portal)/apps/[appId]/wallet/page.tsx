import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import { AppWalletPage } from '@/components/wallet/app-wallet-page';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { getDictionary } from '@/lib/dictionary';

export default async function WalletPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const user = await getDashboardUser();
  const app = await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const w = dictionary.wallet;
  const greeting = user.name ?? user.username ?? user.email ?? 'Developer';

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        eyebrow={
          <p dir="ltr" className="font-mono text-[11px] text-[var(--muted-foreground)]">
            {app.appId}
          </p>
        }
        title={w.title}
        description={w.subtitle.replace('{name}', greeting)}
      />

      <AppWalletPage publicAppId={app.appId} />
    </div>
  );
}
