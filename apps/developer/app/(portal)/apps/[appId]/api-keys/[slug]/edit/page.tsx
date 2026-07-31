import { notFound } from 'next/navigation';
import { requireAppForUser, fetchApiKeysForApp } from '@/lib/dal';
import { EditApiKeyForm } from '@/components/api-keys/edit-api-key-form';
import { getDictionary } from '@/lib/dictionary';

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
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {ep.heading}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          {ep.description}
        </p>
      </header>

      <EditApiKeyForm apiKey={apiKey} />
    </div>
  );
}
