"use client"
import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AuthFooterProps {
  className?: string
}

export function AuthFooter({ className }: AuthFooterProps) {
  return (
    <footer className={cn("mt-10 flex items-center justify-center gap-1 text-xs text-muted-foreground", className)}>
      <Link
        href="/terms"
        className="underline underline-offset-3 hover:text-foreground transition-colors"
      >
        Terms of Use
      </Link>
      <span className="mx-2 opacity-40">|</span>
      <Link
        href="/privacy"
        className="underline underline-offset-3 hover:text-foreground transition-colors"
      >
        Privacy Policy
      </Link>
    </footer>
  )
}
