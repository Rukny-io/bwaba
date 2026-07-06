'use client';

import { SubmissionsWorkspace } from '@/components/forms/submissions/submissions-workspace';

export function SubmissionsView({ formId }: { formId: string }) {
  return <SubmissionsWorkspace formId={formId} />;
}
