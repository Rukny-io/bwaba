import type { ReactNode } from 'react';

export default function FormCreatorRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="font-sans">{children}</div>;
}
