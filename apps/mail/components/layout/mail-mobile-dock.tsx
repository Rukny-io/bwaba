"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { cn, Dropdown, Label } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import {
  isNavItemActive,
  mailNavForPathname,
  type MailNavItem,
} from "@/lib/mail-nav-scoped";

const DOCK_PRIMARY_COUNT = 3;

function DockNavItem({
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
      className="flex shrink-0"
    >
      <div
        className={cn(
          "relative flex h-11 min-w-11 items-center justify-center rounded-full transition-all duration-300 ease-out",
          active
            ? "gap-1.5 bg-[var(--foreground)] px-3.5 text-[var(--background)]"
            : "px-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        )}
      >
        <Icon
          size={active ? 18 : 20}
          strokeWidth={active ? 2.2 : 1.7}
          className="shrink-0"
          aria-hidden
        />
        {active ? (
          <span className="max-w-[5.5rem] truncate text-[12px] font-semibold tracking-tight">
            {item.label}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export function MailMobileDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { primary, secondary } = mailNavForPathname(pathname);
  const { pendingHref, setPendingHref } = useMailNavPending();
  const [open, setOpen] = useState(false);

  const dockItems = useMemo(
    () => primary.slice(0, DOCK_PRIMARY_COUNT),
    [primary],
  );
  const moreItems = useMemo(
    () => [...primary.slice(DOCK_PRIMARY_COUNT), ...secondary],
    [primary, secondary],
  );

  const activeMoreHref = useMemo(() => {
    const match = moreItems.find(
      (item) =>
        isNavItemActive(pathname, item.href, item.exact) ||
        pendingHref === item.href,
    );
    return match?.href ?? null;
  }, [moreItems, pathname, pendingHref]);

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
      <div className="pointer-events-auto relative mx-auto flex w-full max-w-[27rem] items-center justify-center gap-2 px-3">
        <nav
          aria-label="Main"
          className="flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--field-background)] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {dockItems.map((item) => (
            <DockNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              pendingHref={pendingHref}
              setPendingHref={setPendingHref}
            />
          ))}
        </nav>

        <Dropdown isOpen={open} onOpenChange={setOpen}>
          <Dropdown.Trigger
            aria-label={open ? "Close more sections" : "More sections"}
            className={cn(
              "flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border border-[var(--border)] outline-none transition-colors",
              open || activeMoreHref
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "bg-[var(--field-background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {open ? (
              <X size={19} strokeWidth={2.2} aria-hidden />
            ) : (
              <Plus size={20} strokeWidth={2.1} aria-hidden />
            )}
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="top"
            className="min-w-[16rem] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--field-background)]"
          >
            <Dropdown.Menu
              selectedKeys={activeMoreHref ? new Set([activeMoreHref]) : new Set()}
              selectionMode="single"
              onAction={(key) => {
                const href = String(key);
                const item = moreItems.find((entry) => entry.href === href);
                if (!item) return;
                const routeActive = isNavItemActive(
                  pathname,
                  item.href,
                  item.exact,
                );
                if (!routeActive) setPendingHref(item.href);
                router.push(item.href);
              }}
            >
              <Dropdown.Section>
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Dropdown.Item
                      key={item.href}
                      id={item.href}
                      textValue={item.label}
                    >
                      <Dropdown.ItemIndicator />
                      <Icon
                        size={16}
                        strokeWidth={1.9}
                        className="shrink-0 text-[var(--muted-foreground)]"
                        aria-hidden
                      />
                      <Label>{item.label}</Label>
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}
