"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLinkStatus } from "next/link";
import { LogOut, Settings, User } from "lucide-react";
import { cn, Dropdown } from "@heroui/react";
import { useMailNavPending } from "@/components/layout/mail-nav-pending";
import { fetchCurrentUser } from "@/lib/api/auth";
import {
  isNavItemActive,
  filterMailNavWithoutTeam,
  mailNavForPathname,
  type MailNavItem,
} from "@/lib/mail-nav-scoped";
import { logoutAndRedirect } from "@/lib/logout";
import { fetchMailSubscription } from "@/lib/mail-subscription-client";

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-100 group-hover:opacity-100
        left-full ml-2.5 after:absolute after:left-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-[var(--foreground)]
    "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return cn(
    "relative flex size-10 items-center justify-center transition-colors duration-75",
    isActive
      ? "rounded-full bg-[var(--foreground)] text-[var(--background)]"
      : "rounded-2xl text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]",
  );
}

function NavLinkVisual({
  item,
  pathname,
}: {
  item: MailNavItem;
  pathname: string;
}) {
  const { href, icon: Icon, label, exact } = item;
  const { pending } = useLinkStatus();
  const { pendingHref } = useMailNavPending();
  const routeActive = isNavItemActive(pathname, href, exact);
  const isActive = routeActive || pending || pendingHref === href;

  return (
    <span
      className={getNavClasses(isActive)}
      aria-hidden
    >
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
      <Tooltip label={label} />
    </span>
  );
}

function NavLink({ item, pathname }: { item: MailNavItem; pathname: string }) {
  const { href, label, exact } = item;
  const router = useRouter();
  const { pendingHref, setPendingHref } = useMailNavPending();
  const routeActive = isNavItemActive(pathname, href, exact);
  const isActive = routeActive || pendingHref === href;

  return (
    <Link
      href={href}
      prefetch
      onMouseEnter={() => {
        router.prefetch(href);
      }}
      onClick={() => {
        if (!routeActive) setPendingHref(href);
      }}
      className="group relative"
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      aria-busy={pendingHref === href || undefined}
    >
      <NavLinkVisual item={item} pathname={pathname} />
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

export function MailSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const nav = mailNavForPathname(pathname);
  const { secondary, footer, slot } = nav;
  const [teamSupported, setTeamSupported] = useState(true);
  const primary = teamSupported
    ? nav.primary
    : filterMailNavWithoutTeam(nav.primary);
  const profileHref = slot !== null ? `/u${slot}/profile` : "/profile";
  const settingsHref = slot !== null ? `/u${slot}/settings` : "/settings";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await fetchCurrentUser();
        if (cancelled || !user) return;
        setAvatarUrl(user.avatar ?? null);
        setUserName(user.name ?? user.username ?? null);
      } catch {
        /* avatar stays as initials */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const snap = await fetchMailSubscription();
        if (cancelled) return;
        const planId = snap.subscription?.planId;
        const consoleSeats = snap.subscription?.limits?.consoleMembersIncluded ?? 0;
        setTeamSupported(planId !== "starter" && consoleSeats > 0);
      } catch {
        if (!cancelled) setTeamSupported(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    for (const item of [...primary, ...secondary, ...footer]) {
      router.prefetch(item.href);
    }
  }, [footer, primary, router, secondary]);

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
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--surface)] px-2 py-3">
          <nav className="flex flex-col items-center gap-2" aria-label="Primary">
            {primary.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-[var(--surface)] px-2 py-3">
        {secondary.length > 0 ? (
          <nav className="flex flex-col items-center gap-2" aria-label="Email tools">
            {secondary.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        ) : null}
        {footer.length > 0
          ? footer.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))
          : null}
        {(secondary.length > 0 || footer.length > 0) ? (
          <div
            className="h-px w-6 bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
            aria-hidden
          />
        ) : null}
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
                href={profileHref}
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
