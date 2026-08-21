"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { isNavItemActive, mailNavForPathname } from "@/lib/mail-nav-scoped";

export function MailHeader() {
  const pathname = usePathname();
  const { header } = mailNavForPathname(pathname);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-start bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <nav
        aria-label="Main"
        className="pointer-events-auto inline-flex w-auto max-w-full items-center gap-0.5 rounded-full border border-white/25 bg-white/14 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_10px_36px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:gap-1 sm:p-1.5"
      >
        {header.map((item) => {
          const active = isNavItemActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3 text-[12.5px] font-semibold tracking-tight transition-colors sm:h-[2.125rem] sm:px-[0.95rem] sm:text-[13px]",
                active
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
