import { notFound } from 'next/navigation';
import { PublicFormPageView } from '@/components/public-form/public-form-page-view';
import { fetchPublicForm } from '@/lib/public-form-api';
import type { Metadata } from 'next';

const SLUG_PATTERN = /^[a-z0-9]{6}$/;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug)) return { title: 'نموذج غير موجود' };

  const form = await fetchPublicForm(slug);
  if (!form) return { title: 'نموذج غير موجود' };

  return {
    title: form.title.trim() || 'نموذج',
    description: form.description?.trim() || undefined,
  };
}

export default async function PublicFormPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === '1';

  if (!SLUG_PATTERN.test(slug)) {
    notFound();
  }

  const form = await fetchPublicForm(slug);

  if (!form || form.slug !== slug) {
    notFound();
  }

  return <PublicFormPageView form={form} slug={slug} embed={isEmbed} />;
}

export const dynamic = 'force-dynamic';
