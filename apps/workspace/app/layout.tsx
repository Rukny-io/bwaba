import type { Metadata } from 'next';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rukny Workspace',
  description: 'بريد إلكتروني مخصص وإدارة دومينات لأعمالك — workspace.rukny.io',
  icons: {
    icon: '/rukny-logo.svg',
    apple: '/rukny-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
