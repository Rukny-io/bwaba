import { requireAppForUser } from '@/lib/dal';
import { CreateApiKeyForm } from '@/components/api-keys/create-api-key-form';
import { getDictionary } from '@/lib/dictionary';

export default async function CreateApiKeyPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const cp = dictionary.apiKeys.createPage;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {cp.heading}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          {cp.description}
        </p>
      </header>

      <CreateApiKeyForm />
    </div>
  );
}
