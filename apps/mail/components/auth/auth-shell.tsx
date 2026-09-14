"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@heroui/react";

interface AuthShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthShell({ children, className = "" }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#fbfbfc] font-sans text-[#1c1917]">
      <header className="relative z-10 border-b border-[#e7e5e4]">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.02em] text-[#1c1917] transition-opacity hover:opacity-80"
          >
            <Image src="/rukny-logo.svg" alt="" width={28} height={28} priority />
            Rukny Mail
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-12">
        <div className={cn("flex w-full max-w-[420px] flex-col items-center", className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
