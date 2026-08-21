import type { Metadata } from "next";
import { thmanyahSans } from "@rukny/thmanyah-font/next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rukny Mail",
  description: "Agentic mail for Rukny",
  icons: {
    icon: "/rukny-logo.svg",
    apple: "/rukny-logo.svg",
  },
};

const themeBootScript = `(function(){try{var t=localStorage.getItem('heroui-theme')||'light';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${thmanyahSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
