import type { Metadata } from 'next';
import { thmanyahSans } from '@rukny/thmanyah-font/next';
import { connection } from 'next/server';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Rukny CEO',
  description: 'Admin control panel for the Rukny platform',
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
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${thmanyahSans.variable} light h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rukny-hq-theme');var theme=t==='dark'?'dark':'light';var r=document.documentElement;r.classList.remove('dark','light');r.classList.add(theme);r.setAttribute('data-theme',theme);r.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
