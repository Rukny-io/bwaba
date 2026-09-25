import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { thmanyahSans } from '@rukny/thmanyah-font/next';

import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ركني — منصة واحدة لكل ما تحتاجه',
  description:
    'ركني للمتاجر الإلكترونية، النماذج الذكية، الملف الشخصي، والتحليلات. تزامن بيانات النماذج مع جداول جوجل عند ربط حساب جوجل.',
  icons: {
    icon: '/rukny-logo.svg',
    apple: '/rukny-logo.svg',
  },
};

const themeBootScript = `(function(){try{var t=localStorage.getItem('theme')||'light';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        inter.variable,
        thmanyahSans.variable,
        'h-full font-sans font-arabic antialiased',
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={cn(
          thmanyahSans.className,
          'min-h-full bg-white font-sans font-arabic text-[#1D1D1D] antialiased',
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
