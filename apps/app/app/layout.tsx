import type { Metadata } from 'next';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { connection } from 'next/server';
import { AppProviders } from '@/components/app/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ركني',
  description: 'أدر روابطك وصفحتك الشخصية على منصة ركني',
  icons: {
    icon: '/rukny-logo.svg',
    apple: '/rukny-logo.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request CSP nonces from middleware require dynamic rendering.
  await connection();

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
