import Link from 'next/link';
import { requireAppForUser } from '@/lib/dal';
import { CreateApiKeyForm } from '@/components/api-keys/create-api-key-form';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { getDictionary } from '@/lib/dictionary';
import { appApiKeys } from '@/lib/app-routes';

export default async function CreateApiKeyPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const cp = dictionary.apiKeys.createPage;

  return (
    <section className="dashboard-page mx-auto flex w-full max-w-3xl flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0"
        title={cp.heading}
        description={cp.description}
        actions={
          <Link
            href={appApiKeys(app.appId)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            {cp.back}
          </Link>
        }
      />
      <CreateApiKeyForm />
    </section>
  );
}
