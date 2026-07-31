import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import { AppWalletPage } from '@/components/wallet/app-wallet-page';
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
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p
          dir="ltr"
          className="mb-1 font-mono text-[11px] text-[var(--muted-foreground)]"
        >
          {app.appId}
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {w.title}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          {w.subtitle.replace('{name}', greeting)}
        </p>
      </header>

      <AppWalletPage publicAppId={app.appId} />
    </div>
  );
}
