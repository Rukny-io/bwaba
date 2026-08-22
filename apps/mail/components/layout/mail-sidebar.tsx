"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, User } from "lucide-react";
import { cn, Dropdown } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import {
  isNavItemActive,
  mailNavForPathname,
  type MailNavItem,
} from "@/lib/mail-nav-scoped";
import { logoutAndRedirect } from "@/lib/logout";

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-150 group-hover:opacity-100
        left-full ml-2.5 after:absolute after:left-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-[var(--foreground)]
    "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return `relative group flex size-10 items-center justify-center transition-colors duration-150 ${
    isActive
      ? "rounded-full bg-[var(--foreground)] text-[var(--background)]"
      : "rounded-2xl text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
  }`;
}

function NavLink({ item, pathname }: { item: MailNavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const { pendingHref, setPendingHref } = useMailNavPending();
  const routeActive = isNavItemActive(pathname, href, exact);
  const isActive = routeActive || pendingHref === href;

  return (
    <Link
      href={href}
      prefetch
      onClick={() => {
        if (!routeActive) setPendingHref(href);
      }}
      className={getNavClasses(isActive)}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      aria-busy={pendingHref === href || undefined}
    >
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} aria-hidden />
      <Tooltip label={label} />
    </Link>
  );
}

function SidebarAvatar({
  avatarUrl,
  userName,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const displayName = userName?.trim() || "U";
  const initials = displayName.charAt(0).toUpperCase();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt={userName ?? "Profile"}
        className="block size-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--foreground)] text-sm font-semibold text-[var(--background)]">
      {initials}
    </span>
  );
}

export function MailSidebar({
  avatarUrl,
  userName,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const { primary, secondary, slot } = mailNavForPathname(pathname);
  const settingsHref = slot !== null ? `/u${slot}/settings` : "/settings";

  return (
    <aside className="fixed top-0 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex left-4">
      <div className="mb-5 flex size-10 items-center justify-center">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny Mail"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-[var(--surface)] px-2 py-3">
          <nav className="flex flex-col items-center gap-1.5" aria-label="Primary">
            {primary.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mb-3 flex flex-col items-center gap-1.5 rounded-2xl bg-[var(--surface)] px-2 py-3">
        <nav className="flex flex-col items-center gap-1.5" aria-label="Email tools">
          {secondary.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Dropdown>
          <Dropdown.Trigger
            aria-label="Profile"
            className={cn(
              "group relative size-10 shrink-0 overflow-hidden rounded-full outline-none",
              "transition-opacity hover:opacity-90",
            )}
          >
            <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="right bottom"
            offset={14}
            className="min-w-[13rem] overflow-hidden rounded-2xl"
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === "logout") void logoutAndRedirect();
              }}
            >
              <Dropdown.Item
                id="profile"
                textValue="Profile"
                href={settingsHref}
                className="gap-2"
              >
                <User className="size-4 shrink-0" />
                Profile
              </Dropdown.Item>
              <Dropdown.Item
                id="settings"
                textValue="Settings"
                href={settingsHref}
                className="gap-2"
              >
                <Settings className="size-4 shrink-0" />
                Settings
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="Log out"
                variant="danger"
                className="gap-2"
              >
                <LogOut className="size-4 shrink-0" />
                Log out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </aside>
  );
}
