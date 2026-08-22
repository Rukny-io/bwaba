"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import { isNavItemActive, mailNavForPathname } from "@/lib/mail-nav-scoped";

export function MailMobileDock() {
  const pathname = usePathname();
  const { primary } = mailNavForPathname(pathname);
  const { pendingHref, setPendingHref } = useMailNavPending();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--background) 88%, transparent) 20%, transparent 100%)",
        }}
      />
      <nav
        aria-label="Main"
        className="pointer-events-auto relative mx-auto flex w-full max-w-[27rem] justify-center px-3"
      >
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--surface)]/90 p-1.5 shadow-[var(--card-shadow)] backdrop-blur-2xl">
          {primary.map((item) => {
            const Icon = item.icon;
            const routeActive = isNavItemActive(pathname, item.href, item.exact);
            const active = routeActive || pendingHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => {
                  if (!routeActive) setPendingHref(item.href);
                }}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="flex shrink-0"
              >
                <div
                  className={cn(
                    "relative flex h-11 min-w-11 items-center justify-center rounded-full transition-all duration-300",
                    active
                      ? "gap-1.5 bg-[var(--foreground)] px-4 text-[var(--background)] shadow-md"
                      : "px-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  <Icon size={active ? 19 : 21} strokeWidth={active ? 2.2 : 1.7} />
                  {active ? (
                    <span className="text-[12.5px] font-semibold tracking-tight">
                      {item.label}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
