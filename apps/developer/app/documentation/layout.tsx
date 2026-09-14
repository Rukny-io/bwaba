import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DocumentationShell } from '@/components/documentation/docs-shell';

export const metadata: Metadata = {
  title: 'Documentation | Rukny Developers',
  description:
    'Learn how to build with Rukny APIs, SDKs, and developer products.',
};

export default function DocumentationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DocumentationShell>{children}</DocumentationShell>;
}
