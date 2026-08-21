"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@heroui/react";
import {
  formatMailIqD,
  mailPlanMonthlyTotal,
  type MailPlanId,
} from "@/lib/mail-plans";
import {
  activateMailSubscription,
  fetchMailPlans,
  fetchMailSubscription,
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
  const router = useRouter();
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
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
        setSubscription(current);
        if (current?.mailboxCount) setMailboxCount(current.mailboxCount);
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

  async function choosePlan(planId: MailPlanId) {
    setError("");
    setBusyPlan(planId);
    try {
      const next = await activateMailSubscription(planId, seats);
      setSubscription(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not activate this plan.");
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
          Prices are in Iraqi dinar (IQD), billed monthly per mailbox on your account.
          Extra mailboxes cost the same as your plan price each.
        </p>
      </header>

      {subscription && subscription.status === "ACTIVE" ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Current plan: {subscription.planName}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {subscription.mailboxCount} mailbox
            {subscription.mailboxCount === 1 ? "" : "es"} ·{" "}
            {formatMailIqD(subscription.monthlyTotal)}/mo
            {subscription.renewsAt
              ? ` · renews ${new Date(subscription.renewsAt).toLocaleDateString("en-GB")}`
              : null}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
          No active Mail subscription yet. Choose a plan to unlock mailbox limits and
          features.
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">Mailbox seats</span>
          <input
            type="number"
            min={1}
            max={500}
            value={seats}
            onChange={(event) => setMailboxCount(Number(event.target.value) || 1)}
            className="h-10 w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </label>
        <p className="pb-2 text-sm text-[var(--muted-foreground)]">
          Billed seats × plan price = monthly total
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
          const isCurrent =
            subscription?.status === "ACTIVE" && subscription.planId === plan.id;
          const busy = busyPlan === plan.id;

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
                disabled={busy || Boolean(busyPlan)}
                onClick={() => choosePlan(plan.id)}
                className={cn(
                  "mt-6 inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:opacity-60",
                  isCurrent
                    ? "bg-[var(--surface-secondary)] text-[var(--foreground)]"
                    : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
                )}
              >
                {busy ? "Saving…" : isCurrent ? "Update seats" : `Choose ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
