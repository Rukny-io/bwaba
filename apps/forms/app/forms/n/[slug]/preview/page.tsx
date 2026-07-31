import { notFound } from 'next/navigation';
import { FormPreviewPageView } from '@/components/forms/form-create/form-preview-page-view';
import { fetchFormServer } from '@/lib/forms-api-server';

const SLUG_PATTERN = /^[a-z0-9]{6}$/;

type Props = { params: Promise<{ slug: string }> };

export default async function FormPreviewPage({ params }: Props) {
  const { slug } = await params;

  if (!SLUG_PATTERN.test(slug)) {
    notFound();
  }

  const form = await fetchFormServer(slug);

  if (!form || form.slug !== slug) {
    notFound();
  }

  return <FormPreviewPageView form={form} slug={slug} />;
}

export const dynamic = 'force-dynamic';
