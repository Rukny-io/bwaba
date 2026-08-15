import type { Metadata } from 'next';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { connection } from 'next/server';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ركني Business',
  description:
    'صندوق وارد موحّد للمحادثات — Instagram و Messenger في لوحة تحكم واحدة بالعربية',
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

  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
