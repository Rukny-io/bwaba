import type { Metadata } from "next";
import { thmanyahSans } from "@rukny/thmanyah-font/next";
import { connection } from "next/server";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Rukny Forms",
  description: "منصة ركني لإنشاء وإدارة النماذج العربية بسرعة واحترافية",
  icons: {
    icon: "/rukny-logo.svg",
    apple: "/rukny-logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Required for per-request CSP nonces in production (see Next.js CSP guide).
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
