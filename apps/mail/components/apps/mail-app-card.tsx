"use client";

import { ChevronRight } from "lucide-react";
import type { MailApp } from "@/lib/mail-apps-client";
import { cn } from "@/lib/utils";

interface MailAppCardProps {
  app: MailApp;
  href: string;
  active?: boolean;
}

export function MailAppCard({ app, href, active }: MailAppCardProps) {
  const initials = app.name.trim().charAt(0).toUpperCase() || "M";

  return (
    // Hard navigation: avoid Next soft-nav caching an old redirect to /inbox.
    <a
      href={href}
      className={cn(
        "dashboard-card group flex flex-col gap-4 rounded-2xl p-5 transition-colors hover:bg-[var(--surface-secondary)]",
        active && "ring-1 ring-[color-mix(in_srgb,var(--foreground)_14%,transparent)]",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
            {app.name}
          </h2>
          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
            {app.primaryDomain || app.contactEmail || "No domain connected"}
          </p>
        </div>

        <ChevronRight className="size-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          dir="ltr"
          className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--muted-foreground)]"
        >
          /u{app.slotIndex}
        </span>
        {app.primaryDomain ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,var(--background))] px-2.5 py-0.5 text-[10px] font-medium text-[var(--success)]">
            {app.primaryDomain}
          </span>
        ) : null}
        {app.isOwner === false ? (
          <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            {app.membershipRole || "Member"}
          </span>
        ) : null}
        {active ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] px-2.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
            Current
          </span>
        ) : null}
        {app.subscription?.status === "ACTIVE" ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,var(--background))] px-2.5 py-0.5 text-[10px] font-medium text-[var(--success)]">
            {app.subscription.plan} · {app.subscription.mailboxCount} seat
            {app.subscription.mailboxCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
            No plan
          </span>
        )}
      </div>
    </a>
  );
}
