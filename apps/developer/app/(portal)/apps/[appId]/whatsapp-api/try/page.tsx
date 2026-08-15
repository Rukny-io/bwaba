import { WhatsappApiTrySection } from '@/components/whatsapp-api/whatsapp-api-try-section';

export default async function WhatsappApiTryPage({
  searchParams,
}: {
  searchParams: Promise<{ endpoint?: string; recipe?: string }>;
}) {
  const { endpoint, recipe } = await searchParams;
  return <WhatsappApiTrySection endpoint={endpoint} recipe={recipe} />;
}
