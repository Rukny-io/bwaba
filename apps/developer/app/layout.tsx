import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { connection } from 'next/server';
import './globals.css';
import { Providers } from './providers';
import { getCurrentLocale } from '@/lib/dictionary';
import { isRtlLocale } from '@/lib/locale';

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rukny Developers',
  description: 'منصة WhatsApp API للمطوّرين',
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
  await connection();
  const locale = await getCurrentLocale();
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${thmanyahSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
