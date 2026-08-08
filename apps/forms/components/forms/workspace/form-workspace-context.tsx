'use client';

import { createContext, useContext } from 'react';
import type { FormDetail } from '@/lib/forms-api';

const FormWorkspaceContext = createContext<FormDetail | null>(null);

export function FormWorkspaceProvider({
  form,
  children,
}: {
  form: FormDetail | null;
  children: React.ReactNode;
}) {
  return (
    <FormWorkspaceContext.Provider value={form}>
      {children}
    </FormWorkspaceContext.Provider>
  );
}

export function useFormWorkspaceForm(): FormDetail | null {
  return useContext(FormWorkspaceContext);
}

export function resolveWorkspaceFormSeed(
  workspaceForm: FormDetail | null | undefined,
  formId: string,
): FormDetail | null {
  if (!workspaceForm) return null;
  if (workspaceForm.id === formId || workspaceForm.slug === formId) {
    return workspaceForm;
  }
  return null;
}
