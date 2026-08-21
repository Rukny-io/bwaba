"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppsFlowShell } from "@/components/apps/apps-flow-shell";
import { MailAppsListPage } from "@/components/apps/mail-apps-list-page";
import { logoutAndRedirect } from "@/lib/logout";
import { listMailApps, type MailApp } from "@/lib/mail-apps-client";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";

function gateMessage(code: string | null): string | null {
  if (code === "app_required") {
    return "Create or open a Mail app to access the rest of Rukny Mail.";
  }
  if (code === "not_found") return "That Mail app was not found.";
  if (code === "invalid") return "Invalid Mail app id.";
  return null;
}

function MailAppsContent() {
  const searchParams = useSearchParams();
  const [apps, setApps] = useState<MailApp[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const gate = gateMessage(searchParams.get("error"));

  useEffect(() => {
    setCurrentAppId(readMailAppIdFromDocument());
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMailApps();
        if (!cancelled) setApps(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load Mail apps.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppsFlowShell size="lg">
      <div className="space-y-4" dir="ltr">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void logoutAndRedirect()}
            className="inline-flex h-9 items-center rounded-full px-3 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </div>

        {gate ? (
          <p
            className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,var(--background))] px-4 py-3 text-center text-sm text-[var(--warning-foreground)]"
            role="status"
          >
            {gate}
          </p>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : error ? (
          <p className="py-16 text-center text-sm text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : (
          <MailAppsListPage apps={apps} currentAppId={currentAppId} />
        )}
      </div>
    </AppsFlowShell>
  );
}

export default function MailAppsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--background)]" />}>
      <MailAppsContent />
    </Suspense>
  );
}
