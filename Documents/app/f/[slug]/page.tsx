import { notFound } from 'next/navigation';
import { PublicFormPageView } from '@/components/public-form/public-form-page-view';
import { PublicFormUnavailableView } from '@/components/public-form/public-form-unavailable-view';
import { PublicFormEmptyState } from '@/components/public-form/public-form-empty-state';
import { fetchPublicForm } from '@/lib/public-form-api';
import { isValidPublicFormSlug } from '@rukny/forms-shared/public-form-utils';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidPublicFormSlug(slug)) return { title: 'نموذج غير موجود' };

  const result = await fetchPublicForm(slug);
  if (!result.ok) {
    if (result.error === 'unavailable' && result.unavailable?.title) {
      return { title: result.unavailable.title.trim() || 'نموذج غير متاح' };
    }
    return { title: 'نموذج غير موجود' };
  }

  return {
    title: result.form.title.trim() || 'نموذج',
    description: result.form.description?.trim() || undefined,
  };
}

export default async function PublicFormPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === '1';

  if (!isValidPublicFormSlug(slug)) {
    notFound();
  }

  const result = await fetchPublicForm(slug);

  if (result.ok) {
    return <PublicFormPageView form={result.form} slug={slug} embed={isEmbed} />;
  }

  if (result.error === 'unavailable' && result.unavailable) {
    return (
      <PublicFormUnavailableView meta={result.unavailable} embed={isEmbed} />
    );
  }

  if (result.error === 'network' && process.env.NODE_ENV === 'development') {
    return (
      <PublicFormEmptyState
        title="تعذّر الاتصال بالخادم"
        description="تأكد أن API يعمل على المنفذ 3001 وأن API_BACKEND_URL مضبوط بشكل صحيح، ثم حدّث الصفحة."
      />
    );
  }

  notFound();
}

export const dynamic = 'force-dynamic';
