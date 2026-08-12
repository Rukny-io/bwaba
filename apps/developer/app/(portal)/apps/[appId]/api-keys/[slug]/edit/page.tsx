import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAppForUser, fetchApiKeysForApp } from '@/lib/dal';
import { EditApiKeyForm } from '@/components/api-keys/edit-api-key-form';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { getDictionary } from '@/lib/dictionary';
import { appApiKeys } from '@/lib/app-routes';

export default async function EditApiKeyPage({
  params,
}: {
  params: Promise<{ appId: string; slug: string }>;
}) {
  const { appId, slug } = await params;
  const app = await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const ep = dictionary.apiKeys.editPage;

  const keys = await fetchApiKeysForApp(app.id);
  const apiKey = keys.find((key) => key.slug === slug);

  if (!apiKey) {
    notFound();
  }

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0"
        title={ep.heading}
        description={ep.description}
        actions={
          <Link
            href={appApiKeys(app.appId)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            {ep.back}
          </Link>
        }
      />
      <EditApiKeyForm apiKey={apiKey} />
    </section>
  );
}
