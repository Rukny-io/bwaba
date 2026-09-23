import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/messages';
import { connection } from 'next/server';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const localeBootScript = `(function(){try{var k='${LOCALE_STORAGE_KEY}';var l=localStorage.getItem(k);if(l!=='en'&&l!=='ar')l='ar';document.documentElement.lang=l;document.documentElement.dir=l==='en'?'ltr':'rtl';}catch(e){}})();`;

export const metadata: Metadata = {
  title: 'Rukny Checkout',
  description: 'Secure checkout: phone verification, delivery address, and Al-Qaseh payment',
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
      className={`${thmanyahSans.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: localeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
