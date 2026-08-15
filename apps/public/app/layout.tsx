import type { Metadata } from "next"
import { thmanyahSans } from "@rukny/thmanyah-font/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { RadialBackground } from "@/components/ui/light-theme-tailwind-css-background-snippet"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Rukny",
  description:
    "Rukny — Arabic SaaS platform for stores, forms, profiles, and analytics.",
  icons: {
    icon: "/rukny-logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn(thmanyahSans.variable, "h-full font-sans font-arabic antialiased")}
    >
      <body
        className={cn(
          thmanyahSans.className,
          "min-h-full font-sans font-arabic antialiased"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <div className="relative isolate min-h-full">
            <RadialBackground />
            <div className="relative z-0 min-h-full">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
