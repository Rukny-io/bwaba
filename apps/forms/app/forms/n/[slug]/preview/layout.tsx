import type { ReactNode } from 'react';
import { CreateFormChrome } from '@/components/forms/form-create/create-form-chrome';

/** معاينة كاملة — نفس chrome إنشاء النموذج */
export default function FormPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CreateFormChrome className="bg-white">{children}</CreateFormChrome>;
}
