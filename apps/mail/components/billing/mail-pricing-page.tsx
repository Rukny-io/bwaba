"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@heroui/react";
import {
  formatMailIqD,
  mailPlanMonthlyTotal,
  type MailPlanId,
} from "@/lib/mail-plans";
import {
  fetchMailPlans,
  fetchMailSubscription,
  requestMailPlan,
  type MailPendingPlanRequest,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

type PlanCard = {
  id: MailPlanId;
  name: string;
  bestFor: string;
  priceMonthly: number;
  popular: boolean;
  highlights: string[];
};

export function MailPricingPage() {
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [mailboxCount, setMailboxCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<MailPlanId | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [plansData, current] = await Promise.all([
          fetchMailPlans(),
          fetchMailSubscription(),
        ]);
        if (cancelled) return;
        setPlans(plansData.plans);
        setNeedsApp(current.needsApp);
        setAppName(current.app?.name ?? null);
        setSubscription(current.subscription);
        setPendingRequest(current.pendingRequest);
        if (current.subscription?.mailboxCount) {
          setMailboxCount(current.subscription.mailboxCount);
        } else if (current.pendingRequest?.mailboxCount) {
          setMailboxCount(current.pendingRequest.mailboxCount);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load pricing.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const seats = useMemo(() => Math.max(1, Math.floor(mailboxCount) || 1), [mailboxCount]);
  const active = subscription?.status === "ACTIVE" ? subscription : null;

  async function choosePlan(planId: MailPlanId) {
    setError("");
    setBusyPlan(planId);
    try {
      const result = await requestMailPlan(planId, seats);
      setPendingRequest(result.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this plan request.");
    } finally {
      setBusyPlan(null);
    }
  }

  if (loading) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Billing
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Mail plans
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Each Mail app has its own subscription — seats, storage, and features are not
          shared with your other apps. Prices are in Iraqi dinar (IQD), billed monthly
          per mailbox. Card payment is coming soon; request a plan and an admin will
          activate it for this app.
        </p>
      </header>

      {needsApp ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
          Open a Mail app first, then return here to request a plan for that app only.{" "}
          <Link
            href="/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Go to apps
          </Link>
        </div>
      ) : active ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Current plan for {appName || "this app"}: {active.planName}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {active.mailboxCount} mailbox
            {active.mailboxCount === 1 ? "" : "es"} ·{" "}
            {active.limits.storageGbPerMailbox} GB storage each ·{" "}
            {formatMailIqD(active.monthlyTotal)}/mo
            {active.renewsAt
              ? ` · renews ${new Date(active.renewsAt).toLocaleDateString("en-GB")}`
              : null}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
          No active plan on {appName || "this Mail app"} yet. Request Starter, Standard,
          or Premium — an admin will activate seats, storage, and features for this app
          only.
        </div>
      )}

      {pendingRequest ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm">
          <p className="font-semibold text-[var(--foreground)]">Request pending</p>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Ticket {pendingRequest.ticketNumber}
            {pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""} ·{" "}
            {pendingRequest.mailboxCount} seat
            {pendingRequest.mailboxCount === 1 ? "" : "s"}. An admin will activate this
            app’s plan.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">Mailbox seats</span>
          <input
            type="number"
            min={1}
            max={500}
            value={seats}
            disabled={needsApp || Boolean(pendingRequest)}
            onChange={(event) => setMailboxCount(Number(event.target.value) || 1)}
            className="h-10 w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)] disabled:opacity-60"
          />
        </label>
        <p className="pb-2 text-sm text-[var(--muted-foreground)]">
          Seats × plan price = monthly total for this app
        </p>
      </div>

      {error ? (
        <p className="text-sm font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const total = mailPlanMonthlyTotal(plan.id, seats);
          const isCurrent = Boolean(active && active.planId === plan.id);
          const busy = busyPlan === plan.id;
          const requestDisabled =
            needsApp || Boolean(pendingRequest) || Boolean(busyPlan);

          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]",
                plan.popular
                  ? "border-[var(--primary)] ring-1 ring-[var(--primary)]"
                  : "border-[var(--border)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{plan.name}</h2>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Best for: {plan.bestFor}
                  </p>
                </div>
                {plan.popular ? (
                  <span className="rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--secondary-foreground)]">
                    Popular
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                {formatMailIqD(plan.priceMonthly)}
                <span className="text-sm font-medium text-[var(--muted-foreground)]">/mo</span>
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                per mailbox · {formatMailIqD(total)}/mo for {seats} seat
                {seats === 1 ? "" : "s"}
              </p>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-[var(--foreground)]">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[var(--success)]"
                      strokeWidth={2.4}
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={requestDisabled}
                onClick={() => void choosePlan(plan.id)}
                className={cn(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-60",
                  isCurrent
                    ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
                )}
              >
                {busy
                  ? "Sending…"
                  : pendingRequest
                    ? "Request pending"
                    : isCurrent
                      ? "Request seat change"
                      : `Request ${plan.name}`}
              </button>
              <button
                type="button"
                disabled
                className="mt-2 inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--muted-foreground)]"
              >
                Pay by card — coming soon
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
