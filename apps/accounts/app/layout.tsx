import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rukny — تسجيل الدخول",
  description: "سجّل دخولك إلى منصة Rukny",
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
      className={cn("h-full antialiased", ibmPlexSansArabic.variable)}
    >
      <body className="min-h-full flex flex-col font-arabic">{children}</body>
    </html>
  );
}
