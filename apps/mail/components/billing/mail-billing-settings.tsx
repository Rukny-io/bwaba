"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMailIqD } from "@/lib/mail-plans";
import {
  fetchMailSubscription,
  type MailPendingPlanRequest,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

const FEATURE_LABELS: Array<{
  key: keyof NonNullable<MailSubscriptionView["features"]>;
  label: string;
}> = [
  { key: "agenticMail", label: "Agentic Mail" },
  { key: "aiToolsUnlimited", label: "Unlimited AI tools" },
  { key: "openTracking", label: "Open tracking" },
  { key: "smartAiReplies", label: "Smart AI replies" },
  { key: "automaticReplies", label: "Automatic replies" },
  { key: "linkAndFileTracking", label: "Link and file tracking" },
];

export function MailBillingSettings() {
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await fetchMailSubscription();
        if (cancelled) return;
        setNeedsApp(current.needsApp);
        setAppName(current.app?.name ?? null);
        setSubscription(current.subscription);
        setPendingRequest(current.pendingRequest);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load subscription.");
          setSubscription(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = subscription?.status === "ACTIVE" ? subscription : null;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Preferences and billing for this Mail app only.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Subscription</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {appName
                ? `Plan, seats, and storage apply only to ${appName}.`
                : "Plan, seats, and storage apply only to the Mail app you have open."}{" "}
              Card payment is coming soon.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)]"
          >
            {active ? "Change plan" : "Request a plan"}
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        ) : needsApp ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Open a Mail app to see its subscription.{" "}
            <Link href="/apps" className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline">
              Go to apps
            </Link>
          </p>
        ) : active ? (
          <>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted-foreground)]">Plan</dt>
                <dd className="font-medium text-[var(--foreground)]">{active.planName}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Monthly total</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {formatMailIqD(active.monthlyTotal)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Mailbox seats</dt>
                <dd className="font-medium text-[var(--foreground)]">{active.mailboxCount}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Renews</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {active.renewsAt
                    ? new Date(active.renewsAt).toLocaleDateString("en-GB")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Storage / mailbox</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {active.limits.storageGbPerMailbox} GB
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Forwarding · Aliases</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {active.limits.forwardingRules} · {active.limits.emailAliases}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
              {FEATURE_LABELS.map((feature) => (
                <li key={feature.key} className="text-[var(--muted-foreground)]">
                  <span className="font-medium text-[var(--foreground)]">
                    {active.features?.[feature.key] ? "On" : "Off"}
                  </span>
                  {" · "}
                  {feature.label}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No active plan on this app. Request Starter, Standard, or Premium from
            Pricing so an admin can activate seats, storage, and features.
          </p>
        )}

        {pendingRequest ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Request pending · ticket {pendingRequest.ticketNumber}
            {pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""} ·{" "}
            {pendingRequest.mailboxCount} seats.
          </p>
        ) : null}
      </div>
    </section>
  );
}
