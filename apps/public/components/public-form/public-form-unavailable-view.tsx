'use client';

import { PublicFormStatusCard } from '@/components/public-form/public-form-status-card';
import type { UnavailableFormMeta } from '@/lib/public-form-api';
import { formUnavailableMessageFromMeta } from '@/lib/public-form-api';

export function PublicFormUnavailableView({
  meta,
  embed = false,
}: {
  meta: UnavailableFormMeta;
  embed?: boolean;
}) {
  return (
    <PublicFormStatusCard
      variant="unavailable"
      title="النموذج غير متاح"
      message={formUnavailableMessageFromMeta(meta)}
      theme={meta.theme}
      embed={embed}
    />
  );
}
