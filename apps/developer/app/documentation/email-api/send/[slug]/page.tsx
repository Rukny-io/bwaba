import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SendExampleArticle } from '@/components/documentation/send-example-article';
import {
  SEND_EXAMPLES,
  getSendExample,
  type SendExampleId,
} from '@/lib/email-api-send-catalog';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEND_EXAMPLES.map((item) => ({ slug: item.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = getSendExample(slug);
  if (!example) {
    return { title: 'Sending examples | Rukny Documentation' };
  }
  return {
    title: `${example.label} — Sending examples | Rukny Documentation`,
    description: example.description,
  };
}

export default async function EmailApiSendExamplePage({ params }: PageProps) {
  const { slug } = await params;
  const example = getSendExample(slug);
  if (!example) notFound();
  return <SendExampleArticle id={example.id as SendExampleId} />;
}
