import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { getDirection } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import {
  getLocaleBodyFontClass,
  getLocaleFontUtilityClass,
} from '@/lib/locale-font';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-arabic',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages();
  const meta = messages.meta as { title: string; description: string };

  return {
    title: meta.title,
    description: meta.description,
    icons: {
      icon: '/rukny-logo.svg',
      apple: '/rukny-logo.svg',
    },
    other: { 'content-language': locale },
  };
}

const themeBootScript = `(function(){try{var t=localStorage.getItem('theme')||'light';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const direction = getDirection(locale);
  const fontUtility = getLocaleFontUtilityClass(locale);
  const bodyFontClass = getLocaleBodyFontClass(locale, {
    arabic: thmanyahSans.className,
    kurdish: notoSansArabic.className,
    latin: inter.className,
  });

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      className={cn(
        inter.variable,
        thmanyahSans.variable,
        notoSansArabic.variable,
        'h-full font-sans antialiased',
        fontUtility,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={cn(
          bodyFontClass,
          'min-h-full bg-white text-[#1D1D1D] antialiased',
          fontUtility,
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
