"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@heroui/react";
import {
  formatMailIqD,
  getMailPlan,
  mailPlanMonthlyTotal,
  type MailPlanId,
  type MailPlanLimits,
} from "@/lib/mail-plans";
import {
  fetchMailPlans,
  fetchMailSubscription,
  requestMailPlan,
  type MailCardPaymentsInfo,
  type MailPendingPlanRequest,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";
import { startMailCheckoutSession } from "@/lib/mail-checkout";

type PlanCard = {
  id: MailPlanId;
  name: string;
  bestFor: string;
  priceMonthly: number;
  priceExtraMailbox?: number;
  popular: boolean;
  highlights: string[];
  limits?: MailPlanLimits;
};

function includedFor(plan: PlanCard): number {
  return plan.limits?.mailboxesIncluded ?? getMailPlan(plan.id).limits.mailboxesIncluded;
}

function extraMailboxPrice(plan: PlanCard): number {
  return plan.priceExtraMailbox ?? getMailPlan(plan.id).priceExtraMailbox;
}

export function MailPricingPage() {
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [seatsByPlan, setSeatsByPlan] = useState<Partial<Record<MailPlanId, number>>>({});
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<MailPlanId | null>(null);
  const [payingPlan, setPayingPlan] = useState<MailPlanId | null>(null);
  const [cardPayments, setCardPayments] = useState<MailCardPaymentsInfo>({
    available: false,
    status: "unavailable",
  });
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
        setCardPayments(plansData.cardPayments);
        setNeedsApp(current.needsApp);
        setAppName(current.app?.name ?? null);
        setSubscription(current.subscription);
        setPendingRequest(current.pendingRequest);

        const nextSeats: Partial<Record<MailPlanId, number>> = {};
        for (const plan of plansData.plans) {
          nextSeats[plan.id] = includedFor(plan);
        }
        const existingCount =
          current.subscription?.mailboxCount || current.pendingRequest?.mailboxCount;
        const existingPlanId = current.subscription?.planId;
        if (existingCount && existingPlanId && nextSeats[existingPlanId] != null) {
          nextSeats[existingPlanId] = Math.max(nextSeats[existingPlanId]!, existingCount);
        }
        setSeatsByPlan(nextSeats);
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

  const active = subscription?.status === "ACTIVE" ? subscription : null;
  const lockSeats = needsApp || Boolean(pendingRequest);

  const planSeats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const plan of plans) {
      const included = includedFor(plan);
      map[plan.id] = Math.max(included, Math.floor(seatsByPlan[plan.id] || included));
    }
    return map;
  }, [plans, seatsByPlan]);

  function setPlanSeats(planId: MailPlanId, next: number, included: number) {
    setSeatsByPlan((prev) => ({
      ...prev,
      [planId]: Math.min(500, Math.max(included, Math.floor(next) || included)),
    }));
  }

  async function choosePlan(planId: MailPlanId) {
    setError("");
    setBusyPlan(planId);
    try {
      const seats = planSeats[planId] || 1;
      const result = await requestMailPlan(planId, seats);
      setPendingRequest(result.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this plan request.");
    } finally {
      setBusyPlan(null);
    }
  }

  async function payPlan(planId: MailPlanId) {
    setError("");
    setPayingPlan(planId);
    try {
      const seats = planSeats[planId] || 1;
      const result = await startMailCheckoutSession(planId, seats);
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setPayingPlan(null);
    }
  }

  if (loading) {
    return <div className="min-h-[40vh]" />;
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-10">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[1.8px] text-[#666666]">
          Billing
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[var(--foreground)]">
          Mail plans
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Each workspace has its own subscription — seats, storage, and features are not
          shared with your other workspaces. Prices are in Iraqi dinar (IQD), billed monthly.
          Extra mailboxes above the included amount are added to the plan total.{" "}
          {cardPayments.available
            ? "Pay securely through Rukny Checkout (Al-Qaseh), or request admin activation."
            : "Card payments are temporarily unavailable — you can still request admin activation."}{" "}
          Starter also requires checkout after DNS is verified — there is no free passage.
        </p>
      </header>

      {needsApp ? (
        <div className="border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
          Open a workspace first, then return here to request a paid plan for that workspace only.{" "}
          <Link
            href="/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Go to workspaces
          </Link>
        </div>
      ) : active ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Current plan for {appName || "this workspace"}: {active.planName}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {active.mailboxCount} mailbox
            {active.mailboxCount === 1 ? "" : "es"} ·{" "}
            {active.limits.storageGbPerMailbox} GB for emails ·{" "}
            {formatMailIqD(active.monthlyTotal)}/mo
            {active.renewsAt
              ? ` · renews ${new Date(active.renewsAt).toLocaleDateString("en-GB")}`
              : null}
          </p>
        </div>
      ) : (
        <div className="border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
          No active plan on {appName || "this workspace"} yet. After DNS is verified, continue
          through Checkout to activate Starter — or choose Standard / Premium below.
        </div>
      )}

      {pendingRequest ? (
        <div className="border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm">
          <p className="font-semibold text-[var(--foreground)]">Request pending</p>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Ticket {pendingRequest.ticketNumber}
            {pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""} ·{" "}
            {pendingRequest.mailboxCount} mailbox
            {pendingRequest.mailboxCount === 1 ? "" : "es"}. An admin will activate this
            app’s plan.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-px overflow-hidden border border-[var(--border)] bg-[var(--border)] lg:grid-cols-3">
        {plans.map((plan) => {
          const included = includedFor(plan);
          const seats = planSeats[plan.id] || included;
          const extra = Math.max(0, seats - included);
          const total = mailPlanMonthlyTotal(plan.id, seats);
          const isCurrent = Boolean(active && active.planId === plan.id);
          const busy = busyPlan === plan.id;
          const paying = payingPlan === plan.id;
          const canPay = !needsApp;
          const requestDisabled =
            needsApp || Boolean(pendingRequest) || Boolean(busyPlan) || Boolean(payingPlan);

          return (
            <article
              key={plan.id}
              className={cn(
                "flex flex-col bg-[var(--surface)] p-5",
                plan.popular && "ring-1 ring-inset ring-[var(--primary)]",
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
                  <span className="border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--secondary-foreground)]">
                    Popular
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Mailboxes</p>
                  {extra > 0 ? (
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      +{formatMailIqD(extraMailboxPrice(plan))}/mo each extra
                    </p>
                  ) : (
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {included} included
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Fewer mailboxes on ${plan.name}`}
                    disabled={lockSeats || seats <= included}
                    onClick={() => setPlanSeats(plan.id, seats - 1, included)}
                    className="inline-flex size-8 items-center justify-center border border-[var(--border)] text-[var(--foreground)] disabled:opacity-40"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                    {seats}
                  </span>
                  <button
                    type="button"
                    aria-label={`More mailboxes on ${plan.name}`}
                    disabled={lockSeats || seats >= 500}
                    onClick={() => setPlanSeats(plan.id, seats + 1, included)}
                    className="inline-flex size-8 items-center justify-center border border-[var(--border)] text-[var(--foreground)] disabled:opacity-40"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[var(--foreground)]">
                {formatMailIqD(total)}
                <span className="text-sm font-medium text-[var(--muted-foreground)]">/mo</span>
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {formatMailIqD(plan.priceMonthly)}/mo for {included} mailbox
                {included === 1 ? "" : "es"}
                {extra > 0
                  ? ` · ${formatMailIqD(extra * extraMailboxPrice(plan))} extra`
                  : ""}
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
                  "mail-frame-cta group relative mt-6 inline-flex w-full items-center justify-center p-1.5 disabled:opacity-60",
                  isCurrent ? "mail-frame-cta--ghost" : "mail-frame-cta--primary",
                )}
              >
                <span className="mail-frame-ticks" aria-hidden>
                  <span className="mail-frame-tick mail-frame-tick--tl" />
                  <span className="mail-frame-tick mail-frame-tick--tr" />
                  <span className="mail-frame-tick mail-frame-tick--bl" />
                  <span className="mail-frame-tick mail-frame-tick--br" />
                </span>
                <span
                  className={cn(
                    "relative inline-flex h-11 w-full items-center justify-center px-4 text-sm font-medium transition-[color,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isCurrent
                      ? "border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)]"
                      : "border border-[#111111] bg-[#111111] text-white group-hover:border-[#111111] group-hover:bg-[#111111]",
                  )}
                >
                  {busy
                    ? "Sending…"
                    : pendingRequest
                      ? "Request pending"
                      : isCurrent
                        ? "Request seat change"
                        : `Request ${plan.name}`}
                </span>
              </button>
              <button
                type="button"
                disabled={
                  needsApp ||
                  Boolean(pendingRequest) ||
                  paying ||
                  !cardPayments.available ||
                  !canPay
                }
                onClick={() => void payPlan(plan.id)}
                className="mt-2 inline-flex h-10 w-full items-center justify-center border border-[var(--border)] px-4 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {paying
                  ? "Opening Checkout…"
                  : cardPayments.available
                    ? `Checkout · ${formatMailIqD(total)}`
                    : "Checkout — unavailable"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
