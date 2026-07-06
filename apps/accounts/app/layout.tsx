import type { Metadata, Viewport } from "next";
import { thmanyahSans } from "@rukny/thmanyah-font/next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Rukny — Auth",
  description: "Authentication for Rukny platform",
  icons: {
    icon: "/rukny-logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252525" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn(thmanyahSans.variable, "h-full font-sans font-arabic antialiased")}
    >
      <body
        className={cn(
          thmanyahSans.className,
          "min-h-full flex flex-col font-sans font-arabic bg-background text-foreground antialiased",
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
