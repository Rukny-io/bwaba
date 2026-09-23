"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import {
  isNavItemActive,
  mailNavForPathname,
  type MailNavItem,
} from "@/lib/mail-nav-scoped";

function HeaderNavVisual({
  item,
  pathname,
  pendingHref,
}: {
  item: MailNavItem;
  pathname: string;
  pendingHref: string | null;
}) {
  const Icon = item.icon;
  const { pending } = useLinkStatus();
  const routeActive = isNavItemActive(pathname, item.href, item.exact);
  const active = routeActive || pending || pendingHref === item.href;

  return (
    <>
      {active ? (
        <motion.span
          layoutId="mail-header-active-pill"
          className="absolute inset-0 -z-10 rounded-full bg-[var(--foreground)] shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
          initial={false}
          transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.55 }}
        />
      ) : null}
      <Icon
        size={15}
        strokeWidth={active ? 2.25 : 1.75}
        className="shrink-0"
        aria-hidden
      />
      <span>{item.label}</span>
    </>
  );
}

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
  const router = useRouter();
  const routeActive = isNavItemActive(pathname, item.href, item.exact);
  const active = routeActive || pendingHref === item.href;

  return (
    <Link
      href={item.href}
      prefetch
      onMouseEnter={() => {
        router.prefetch(item.href);
      }}
      onClick={() => {
        if (!routeActive) setPendingHref(item.href);
      }}
      aria-current={active ? "page" : undefined}
      aria-busy={pendingHref === item.href || undefined}
      className={cn(
        "relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold tracking-tight outline-none transition-colors duration-100",
        "focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20",
        active
          ? "text-[var(--background)]"
          : "text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:text-[var(--foreground)]",
      )}
    >
      <HeaderNavVisual
        item={item}
        pathname={pathname}
        pendingHref={pendingHref}
      />
    </Link>
  );
}

export function MailHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { header } = mailNavForPathname(pathname);
  const { pendingHref, setPendingHref } = useMailNavPending();

  useEffect(() => {
    for (const item of header) {
      router.prefetch(item.href);
    }
  }, [header, router]);

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-start bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
      <LayoutGroup id="mail-header-nav">
        <nav
          aria-label="Main"
          className="pointer-events-auto inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[color-mix(in_srgb,var(--foreground)_8%,var(--border))] bg-[var(--surface)]/85 p-1 shadow-[0_8px_28px_rgba(17,17,17,0.08)] backdrop-blur-2xl [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 sm:p-1.5 [&::-webkit-scrollbar]:hidden"
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
    </header>
  );
}
