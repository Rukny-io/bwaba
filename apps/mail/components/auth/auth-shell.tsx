"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@heroui/react";
import { agFontRootClass } from "@/lib/mail-antigravity-font";
import "@/lib/mail-antigravity-font.css";

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className = "" }: AuthShellProps) {
  return (
    <div
      className={cn(
        agFontRootClass,
        "relative flex min-h-dvh flex-col overflow-hidden bg-white text-[#1D1D1D]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(66,133,244,0.07), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(52,168,83,0.05), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 20%, rgba(234,67,53,0.04), transparent 45%)",
        }}
      />

      <header className="relative z-10">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[1.1rem] font-medium tracking-[-0.03em] text-[#1D1D1D] transition-opacity hover:opacity-80"
          >
            <Image
              src="/rukny-logo.svg"
              alt=""
              width={28}
              height={28}
              priority
              className="size-7"
            />
            Rukny Mail
          </Link>
          <Link
            href="/pricing"
            className="text-[14px] font-medium text-[#6B6F76] transition-colors hover:text-[#1D1D1D]"
          >
            Pricing
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div
          className={cn(
            "flex w-full max-w-[420px] flex-col items-center",
            className,
          )}
        >
          {children}
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center">
        <p className="text-[13px] text-[#9CA3AF]">
          Business email on your domain
        </p>
      </footer>
    </div>
  );
}
