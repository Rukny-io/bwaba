import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DocumentationShell } from '@/components/documentation/documentation-shell';
import { getDictionary } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return {
    title: dictionary.docs.metaTitle,
    description: dictionary.docs.metaDescription,
  };
}

export default function DocumentationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DocumentationShell>{children}</DocumentationShell>;
}
