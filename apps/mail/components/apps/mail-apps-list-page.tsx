"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Layers } from "lucide-react";
import type { MailApp } from "@/lib/mail-apps-client";
import { MailAppCard } from "@/components/apps/mail-app-card";

interface MailAppsListPageProps {
  apps: MailApp[];
  currentAppId?: string | null;
}

export function MailAppsListPage({ apps, currentAppId }: MailAppsListPageProps) {
  const isEmpty = apps.length === 0;

  return (
    <div className="dashboard-section-stack" dir="ltr">
      <header className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-[var(--primary)] uppercase">
          Mail workspaces
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {isEmpty ? "Set up your mail" : "Your workspaces"}
        </h1>
        <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          {isEmpty
            ? "One workspace per domain — mailboxes, DNS, and its own plan."
            : "Each workspace has its own domain and plan. Open one or add another."}
        </p>
      </header>

      {isEmpty ? (
        <div className="dashboard-card flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]">
            <Layers className="size-7" />
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
            No workspace yet. Connect a domain you own and create your first mailbox.
          </p>
          <Link
            href="/apps/creation"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Start mail
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((app) => (
            <MailAppCard
              key={app.appId}
              app={app}
              href={`/apps/${app.appId}/open`}
              active={currentAppId === app.appId}
            />
          ))}

          <Link
            href="/apps/creation"
            className="dashboard-card group flex min-h-[120px] flex-col items-center justify-center gap-2 border-2 border-dashed border-transparent p-5 transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              New workspace
            </span>
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1 hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="size-3" />
          Back to home
        </Link>
      </p>
    </div>
  );
}
