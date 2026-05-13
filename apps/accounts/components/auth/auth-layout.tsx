import React from "react"
import { cn } from "@/lib/utils"

// شعار Rukny SVG
function RuknyLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-8", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Rukny"
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M8 10h10a4 4 0 0 1 0 8h-4l6 4H16l-5.5-4H10v4H8V10z"
        fill="white"
      />
      <rect x="10" y="12" width="7" height="1.5" rx="0.75" fill="white" opacity="0" />
    </svg>
  )
}

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
  showLogo?: boolean
  title?: string
  description?: string
}

export function AuthLayout({
  children,
  className,
  showLogo = true,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {showLogo && (
        <header className="px-6 py-5 flex items-center">
          <div className="flex items-center gap-2.5">
            <RuknyLogo />
            <span className="text-base font-semibold text-foreground tracking-tight">
              Rukny
            </span>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div
          className={cn(
            "w-full max-w-[420px] flex flex-col items-center",
            className
          )}
        >
          {(title || description) && (
            <div className="w-full text-center mb-8">
              {title && (
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

