import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { thmanyahSans } from "@rukny/thmanyah-font/next";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'rukny.work',
  description: 'موقع تجريبي لتضمين نماذج ركني',
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
      className={`${thmanyahSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${thmanyahSans.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
