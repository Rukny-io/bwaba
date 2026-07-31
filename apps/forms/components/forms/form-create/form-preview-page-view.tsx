'use client';

import { useMemo, useState } from 'react';
import { PublicFormView } from '@/components/public-form/public-form-view';
import { FormPreviewPageChrome } from '@/components/public-form/form-preview-page-chrome';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import type { FormDetail } from '@/lib/forms-api';
import { getFormCreatingPath } from '@/lib/forms-paths';

interface FormPreviewPageViewProps {
  form: FormDetail;
  slug: string;
}

export function FormPreviewPageView({ form, slug }: FormPreviewPageViewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const { limits } = usePlanLimits();
  const showBranding = !(limits?.removeWatermark ?? false);

  const sortedFields = useMemo(
    () => [...(form.fields ?? [])].sort((a, b) => a.order - b.order),
    [form.fields],
  );

  return (
    <>
      <FormPreviewPageChrome
        slug={slug}
        backHref={getFormCreatingPath(slug)}
        backLabel="متابعة التحرير"
      />

      <PublicFormView
          title={form.title}
          description={form.description}
          coverUrl={form.coverImage ?? null}
          theme={form.theme}
          fields={sortedFields}
          values={values}
          onFieldChange={(fieldId, value) =>
            setValues((prev) => ({ ...prev, [fieldId]: value }))
          }
          showQuestionNumbers={false}
          preview
          previewNote="معاينة — الإرسال معطّل حتى النشر"
          showBranding={showBranding}
        />
    </>
  );
}
