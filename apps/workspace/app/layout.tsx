import type { Metadata } from 'next';
import { thmanyahSans } from '@/lib/thmanyah-font';
import { WORKSPACE_THEME_INIT_SCRIPT } from '@/lib/workspace-theme-script';
import { ThemeProvider } from '@/components/theme-provider';
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
      suppressHydrationWarning
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: WORKSPACE_THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
