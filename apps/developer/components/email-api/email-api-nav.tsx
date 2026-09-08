"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  ["Overview", ""],
  ["Authentication", "auth"],
  ["Messages", "messages"],
  ["Domains", "domains"],
  ["Try it", "try"],
] as const;

export function EmailApiNav({ baseHref }: { baseHref: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto" aria-label="Email API">
      {sections.map(([label, slug]) => {
        const href = slug ? `${baseHref}/${slug}` : baseHref;
        const active = slug
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === baseHref || pathname === `${baseHref}/`;
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-xl px-4 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
