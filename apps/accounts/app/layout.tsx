import type { Metadata, Viewport } from "next";
import { thmanyahSans } from "@/lib/thmanyah-font";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "@/lib/i18n";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Rukny — accounts",
  description: "Authentication for Rukny platform",
  icons: {
    icon: "/rukny-logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
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
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
