import type { ReactNode } from 'react';
import { CreateFormChrome } from '@/components/forms/form-create/create-form-chrome';

export default function FormCreatingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CreateFormChrome>{children}</CreateFormChrome>;
}
