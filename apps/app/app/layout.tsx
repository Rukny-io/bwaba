import type { Metadata, Viewport } from 'next';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { connection } from 'next/server';
import { AppProviders } from '@/components/app/app-providers';
import { getDictionary } from '@/lib/i18n/server';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: t('brand.name'),
    description: t('brand.description'),
    icons: {
      icon: '/rukny-logo.svg',
      apple: '/rukny-logo.svg',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafbfc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e13' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request CSP nonces from middleware require dynamic rendering.
  await connection();
  const { locale, direction } = await getDictionary();

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='rukny-app-locale';var m=document.cookie.match(/(?:^|; )rukny-app-locale=([^;]*)/);var c=m?decodeURIComponent(m[1]):null;var l=c||localStorage.getItem(k)||'ar';if(l!=='en')l='ar';var d=l==='en'?'ltr':'rtl';document.documentElement.lang=l;document.documentElement.dir=d;document.documentElement.dataset.dashboardLocale=l;}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <AppProviders initialLocale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
