"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import {
  isNavItemActive,
  mailNavForPathname,
  type MailNavItem,
} from "@/lib/mail-nav-scoped";

function HeaderNavItem({
  item,
  pathname,
  pendingHref,
  setPendingHref,
}: {
  item: MailNavItem;
  pathname: string;
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
}) {
  const Icon = item.icon;
  const routeActive = isNavItemActive(pathname, item.href, item.exact);
  const active = routeActive || pendingHref === item.href;

  return (
    <Link
      href={item.href}
      prefetch
      onClick={() => {
        if (!routeActive) setPendingHref(item.href);
      }}
      aria-current={active ? "page" : undefined}
      aria-busy={pendingHref === item.href || undefined}
      className={cn(
        "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold tracking-tight outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20",
        active
          ? "text-[var(--background)]"
          : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:text-[var(--foreground)]",
      )}
    >
      {active ? (
        <motion.span
          layoutId="mail-header-active-pill"
          className="absolute inset-0 -z-10 rounded-full bg-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
          transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
        />
      ) : null}
      <Icon
        size={15}
        strokeWidth={active ? 2.25 : 1.75}
        className="shrink-0"
        aria-hidden
      />
      <span>{item.label}</span>
    </Link>
  );
}

function HeaderToolsItem({
  item,
  pathname,
  pendingHref,
  setPendingHref,
}: {
  item: MailNavItem;
  pathname: string;
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
}) {
  const Icon = item.icon;
  const routeActive = isNavItemActive(pathname, item.href, item.exact);
  const active = routeActive || pendingHref === item.href;

  return (
    <Link
      href={item.href}
      prefetch
      onClick={() => {
        if (!routeActive) setPendingHref(item.href);
      }}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      aria-busy={pendingHref === item.href || undefined}
      title={item.label}
      className={cn(
        "group relative z-10 flex size-9 items-center justify-center rounded-full outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20",
        active
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.75} aria-hidden />
      <span
        className="
          pointer-events-none absolute top-full z-50 mt-2 left-1/2 -translate-x-1/2
          whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
          opacity-0 transition-opacity duration-150 group-hover:opacity-100
          after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-[var(--foreground)]
        "
      >
        {item.label}
      </span>
    </Link>
  );
}

export function MailHeader() {
  const pathname = usePathname();
  const { header, secondary } = mailNavForPathname(pathname);
  const { pendingHref, setPendingHref } = useMailNavPending();

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden items-start justify-between gap-3 bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <LayoutGroup id="mail-header-nav">
        <nav
          aria-label="Main"
          className="pointer-events-auto inline-flex max-w-full items-center gap-0.5 rounded-full border border-[color-mix(in_srgb,var(--foreground)_8%,var(--border))] bg-[var(--surface)]/85 p-1 shadow-[0_8px_28px_rgba(17,17,17,0.08)] backdrop-blur-2xl sm:gap-1 sm:p-1.5"
        >
          {header.map((item) => (
            <HeaderNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              pendingHref={pendingHref}
              setPendingHref={setPendingHref}
            />
          ))}
        </nav>
      </LayoutGroup>

      {secondary.length > 0 ? (
        <nav
          aria-label="Workspace tools"
          className="pointer-events-auto inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[color-mix(in_srgb,var(--foreground)_8%,var(--border))] bg-[var(--surface)]/85 p-1 shadow-[0_8px_28px_rgba(17,17,17,0.08)] backdrop-blur-2xl sm:p-1.5"
        >
          {secondary.map((item) => (
            <HeaderToolsItem
              key={item.href}
              item={item}
              pathname={pathname}
              pendingHref={pendingHref}
              setPendingHref={setPendingHref}
            />
          ))}
        </nav>
      ) : null}
    </header>
  );
}
