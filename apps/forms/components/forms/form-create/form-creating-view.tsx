'use client';

import type { FormDetail } from '@/lib/forms-api';
import { FormCreateCanvas } from '@/components/forms/form-create/form-create-canvas';

interface FormCreatingViewProps {
  form: FormDetail;
  slug: string;
}

export function FormCreatingView({ form, slug }: FormCreatingViewProps) {
  return <FormCreateCanvas form={form} slug={slug} />;
}
