import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import { ApiKeysList } from '@/components/api-keys/api-keys-list';
import { getDictionary } from '@/lib/dictionary';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const user = await getDashboardUser();
  const app = await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const s = dictionary.apiKeys;
  const greeting = user.name ?? user.username ?? user.email ?? 'Developer';

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {s.title}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          {s.subtitle.replace('{name}', greeting)}
        </p>
        <p
          dir="ltr"
          className="mt-2 inline-flex rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 font-mono text-[10px] text-[var(--muted-foreground)] sm:text-[11px]"
        >
          {app.appId}
        </p>
      </header>

      <ApiKeysList />
    </div>
  );
}
