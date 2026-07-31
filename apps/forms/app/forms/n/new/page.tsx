import { redirect } from 'next/navigation';
import {
  createFormDraftServer,
  createFormFromTemplateServer,
} from '@/lib/forms-api-server';
import { getTemplateById } from '@/lib/form-templates';
import { getPreviewPathAfterTemplate } from '@/lib/form-template-create';
import { getFormCreatingPath } from '@/lib/forms-paths';

type Props = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewFormDraftPage({ searchParams }: Props) {
  const { template: templateId } = await searchParams;

  if (templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      redirect('/app/templates');
    }

    const form = await createFormFromTemplateServer(templateId);
    if (!form?.slug) {
      redirect('/app/templates');
    }

    redirect(getPreviewPathAfterTemplate(form.slug));
  }

  const form = await createFormDraftServer();

  if (!form?.slug) {
    redirect('/app/forms');
  }

  redirect(getFormCreatingPath(form.slug));
}

/** Force dynamic — always create a fresh draft. */
export const dynamic = 'force-dynamic';
