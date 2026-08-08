'use client';

import { useMemo } from 'react';
import {
  resolveWorkspaceFormSeed,
  useFormWorkspaceForm,
} from '@/components/forms/workspace/form-workspace-context';
import type { FormDetail } from '@/lib/forms-api';

export function useFormWorkspaceSeed(formId: string): FormDetail | null {
  const workspaceForm = useFormWorkspaceForm();
  return useMemo(
    () => resolveWorkspaceFormSeed(workspaceForm, formId),
    [workspaceForm, formId],
  );
}
