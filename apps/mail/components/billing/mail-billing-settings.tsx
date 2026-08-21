"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMailIqD } from "@/lib/mail-plans";
import {
  fetchMailSubscription,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

export function MailBillingSettings() {
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await fetchMailSubscription();
        if (!cancelled) setSubscription(current);
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
          Account preferences and Mail billing.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Subscription</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Plans are billed in IQD per mailbox, stored on your user account in the API.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)]"
          >
            {active ? "Change plan" : "View plans"}
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        ) : active ? (
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
        ) : (
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            No active plan. Choose Starter, Standard, or Premium to set your limits.
          </p>
        )}
      </div>
    </section>
  );
}
