import { createForm, type FormDetail } from '@/lib/forms-api';
import {
  buildCreateFormPayloadFromTemplate,
  getTemplateById,
} from '@/lib/form-templates';
import { getFormCreatingPath, getFormPreviewPath } from '@/lib/forms-paths';

export async function createFormFromTemplate(
  templateId: string,
): Promise<FormDetail> {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error('القالب غير موجود');
  }

  return createForm(buildCreateFormPayloadFromTemplate(template));
}

export function getCreatingPathAfterTemplate(slug: string): string {
  return getFormCreatingPath(slug);
}

export function getPreviewPathAfterTemplate(slug: string): string {
  return getFormPreviewPath(slug);
}
