'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FormCreateDocumentCard } from '@/components/forms/form-create/form-create-primitives';

interface FormCreateWorkspaceProps {
  children: ReactNode;
  className?: string;
  documentClassName?: string;
}

export function FormCreateWorkspace({
  children,
  className,
  documentClassName,
}: FormCreateWorkspaceProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-20 pt-1 sm:px-4 sm:pb-16',
        className,
      )}
    >
      <FormCreateDocumentCard className={documentClassName}>
        {children}
      </FormCreateDocumentCard>
    </div>
  );
}
