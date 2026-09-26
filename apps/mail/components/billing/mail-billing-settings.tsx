"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Minus, Plus } from "lucide-react";
import {
  Button,
  Chip,
  Description,
  Dropdown,
  Label,
  Skeleton,
} from "@heroui/react";
import { BillingNotice, BillingPanel, BillingSection } from "@/components/billing/billing-ui";
import {
  formatMailAliasLimit,
  formatMailIqD,
  getMailPlan,
  mailPlanMonthlyTotal,
  type MailPlanId,
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

const FEATURE_LABELS: Array<{
  key: keyof NonNullable<MailSubscriptionView["features"]>;
  label: string;
}> = [
  { key: "agenticMail", label: "AI email assistant" },
  { key: "aiToolsUnlimited", label: "Unlimited AI tools" },
  { key: "openTracking", label: "Open tracking" },
  { key: "smartAiReplies", label: "Smart AI replies" },
  { key: "automaticReplies", label: "Automatic replies" },
  { key: "linkAndFileTracking", label: "Link and file tracking" },
  { key: "premiumDelivery", label: "Premium email delivery" },
];

type PlanOption = {
  id: MailPlanId;
  name: string;
  bestFor: string;
  priceMonthly: number;
  priceExtraMailbox: number;
  popular: boolean;
  mailboxesIncluded: number;
};

function includedFor(plan: PlanOption): number {
  return plan.mailboxesIncluded || getMailPlan(plan.id).limits.mailboxesIncluded;
}

export function MailPlanSettingsSection() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [subscription, setSubscription] = useState<MailSubscriptionView | null>(null);
  const [unifiedPlan, setUnifiedPlan] = useState<
    import("@/lib/mail-subscription-client").MailUnifiedPlanSnapshot | null
  >(null);
  const [domainQuota, setDomainQuota] = useState<
    import("@/lib/mail-subscription-client").MailDomainQuotaSnapshot | null
  >(null);
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [canManageBilling, setCanManageBilling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cardPayments, setCardPayments] = useState<MailCardPaymentsInfo>({
    available: false,
    status: "unavailable",
  });
  const [selectedPlanId, setSelectedPlanId] = useState<MailPlanId>("standard");
  const [seats, setSeats] = useState(3);

  const refresh = useCallback(async () => {
    const [plansData, current] = await Promise.all([
      fetchMailPlans(),
      fetchMailSubscription(),
    ]);
    const nextPlans: PlanOption[] = plansData.plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      bestFor: plan.bestFor,
      priceMonthly: plan.priceMonthly,
      priceExtraMailbox: plan.priceExtraMailbox ?? 0,
      popular: Boolean(plan.popular),
      mailboxesIncluded:
        plan.limits?.mailboxesIncluded ?? getMailPlan(plan.id).limits.mailboxesIncluded,
    }));
    setPlans(nextPlans);
    setCardPayments(plansData.cardPayments);
    setNeedsApp(current.needsApp);
    setAppName(current.app?.name ?? null);
    setSubscription(current.subscription);
    setUnifiedPlan(current.unifiedPlan ?? null);
    setDomainQuota(current.domainQuota ?? null);
    setPendingRequest(current.pendingRequest);
    setCanManageBilling(Boolean(current.canManageBilling));

    const preferred =
      nextPlans.find((plan) => plan.id === "standard") ??
      nextPlans.find((plan) => plan.id === "premium") ??
      nextPlans[0];
    if (preferred) {
      const existingCount =
        current.subscription?.mailboxCount || current.pendingRequest?.mailboxCount;
      const included = includedFor(preferred);
      setSelectedPlanId(preferred.id);
      setSeats(Math.max(included, existingCount || included));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
        if (!cancelled) setError("");
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
  }, [refresh]);

  const active = subscription?.status === "ACTIVE" ? subscription : null;
  const activeFeatures = useMemo(
    () =>
      active
        ? FEATURE_LABELS.filter((feature) => active.features?.[feature.key])
        : [],
    [active],
  );
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const included = selectedPlan ? includedFor(selectedPlan) : 1;
  const clampedSeats = Math.max(included, Math.min(500, seats));
  const monthlyTotal = selectedPlan
    ? mailPlanMonthlyTotal(selectedPlan.id, clampedSeats)
    : 0;
  const formLocked =
    needsApp || !canManageBilling || busy || paying || !selectedPlan;
  const ticketLocked = formLocked || Boolean(pendingRequest);
  const checkoutLocked = formLocked || !cardPayments.available;

  function onSelectPlan(planId: MailPlanId) {
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return;
    const nextIncluded = includedFor(plan);
    setSelectedPlanId(planId);
    setSeats((prev) => Math.max(nextIncluded, prev));
  }

  async function onRequestPlan() {
    if (!selectedPlan || ticketLocked) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await requestMailPlan(selectedPlan.id, clampedSeats);
      setPendingRequest(result.ticket);
      setSuccess(
        result.alreadyPending
          ? `Request already pending · ticket ${result.ticket.ticketNumber}.`
          : `Request sent · ticket ${result.ticket.ticketNumber}. An admin will activate this plan.`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit this plan request.");
    } finally {
      setBusy(false);
    }
  }

  async function onPayPlan() {
    if (!selectedPlan || checkoutLocked) return;
    setPaying(true);
    setError("");
    setSuccess("");
    try {
      const result = await startMailCheckoutSession(
        selectedPlan.id,
        clampedSeats,
      );
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setPaying(false);
    }
  }

  return (
    <BillingSection
      title="Subscription"
      description={
        appName
          ? `Seats and storage apply only to ${appName}. ${
              cardPayments.available
                ? "Continue through Rukny Checkout, or request admin activation."
                : "Card payments are temporarily unavailable."
            }`
          : `Seats and storage apply only to the workspace you have open. ${
              cardPayments.available
                ? "Continue through Rukny Checkout, or request admin activation."
                : "Card payments are temporarily unavailable."
            }`
      }
      action={
        loading ? undefined : (
          <Chip
            color={active ? "success" : pendingRequest ? "warning" : "default"}
            size="sm"
            variant="soft"
          >
            {active ? active.planName : pendingRequest ? "Pending" : "No plan"}
          </Chip>
        )
      }
    >
      {error ? (
        <BillingNotice
          tone="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {success ? (
        <BillingNotice
          tone="success"
          title="Request submitted"
          description={success}
          onDismiss={() => setSuccess("")}
        />
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : needsApp ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          Open a workspace to see its subscription.
        </p>
      ) : active ? (
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--muted-foreground)]">
                {active.planName} plan
              </p>
              <p className="mt-0.5 text-[1.75rem] font-medium tracking-[-0.03em] tabular-nums text-[var(--foreground)]">
                {formatMailIqD(active.monthlyTotal)}
                <span className="ms-1 text-sm font-medium text-[var(--muted-foreground)]">
                  /mo
                </span>
              </p>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {active.mailboxCount} seat
              {active.mailboxCount === 1 ? "" : "s"}
              {active.renewsAt
                ? ` · renews ${new Date(active.renewsAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[13px] text-[var(--muted-foreground)]">
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1">
              {active.limits.storageGbPerMailbox} GB / mailbox
            </span>
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1">
              {active.limits.forwardingRules} forwards
            </span>
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1">
              {formatMailAliasLimit(active.limits.emailAliases)} aliases
            </span>
          </div>

          {activeFeatures.length > 0 ? (
            <div className="min-w-0 border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-[12px] font-medium text-[var(--muted-foreground)]">
                Included
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {activeFeatures.map((feature) => (
                  <li
                    key={feature.key}
                    className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--foreground)]"
                  >
                    {feature.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          {unifiedPlan
            ? `Unified plan: ${unifiedPlan.marketingNameEn} · ${unifiedPlan.monthlyQuota.toLocaleString("en-IQ")} emails/mo. Upgrade via the developer portal checkout.`
            : "No paid plan on this workspace yet. Use Free, Growth, or Enterprise from the unified catalog."}
        </p>
      )}

      {unifiedPlan ? (
        <BillingNotice
          tone="info"
          title="Mail + Email API"
          description={`This workspace shares the ${unifiedPlan.marketingNameEn} plan with your linked developer app. Mailbox sends count against the same ${unifiedPlan.monthlyQuota.toLocaleString("en-IQ")} email quota.${
            domainQuota
              ? ` Domains on your account: ${domainQuota.used} / ${domainQuota.limit}.`
              : ""
          }`}
        />
      ) : null}

      {pendingRequest ? (
        <BillingNotice
          tone="warning"
          title="Request pending"
          description={`Ticket ${pendingRequest.ticketNumber}${
            pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""
          } · ${pendingRequest.mailboxCount} seat${
            pendingRequest.mailboxCount === 1 ? "" : "s"
          }. An admin will activate this workspace plan — or pay now with Checkout.`}
        />
      ) : null}

      {!needsApp && canManageBilling && plans.length > 0 ? (
        <BillingPanel className="flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Change subscription
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Choose a plan and mailbox seats for this workspace. Pay by card or open a
              ticket for admin activation.
            </p>
          </div>

          <div className="min-w-0">
            <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Plan
            </Label>
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Select plan"
                isDisabled={busy || paying}
                className="inline-flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
              >
                <span className="min-w-0 truncate">
                  {selectedPlan
                    ? `${selectedPlan.name} · from ${formatMailIqD(selectedPlan.priceMonthly)}/mo`
                    : "Select a plan"}
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-[var(--muted-foreground)]" />
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="bottom start"
                className="min-w-[16rem] overflow-hidden rounded-2xl"
              >
                <Dropdown.Menu
                  selectedKeys={new Set([selectedPlanId])}
                  selectionMode="single"
                  onSelectionChange={(keys) => {
                    if (keys === "all") return;
                    const next = [...keys][0];
                    if (next == null) return;
                    onSelectPlan(String(next) as MailPlanId);
                  }}
                >
                  <Dropdown.Section>
                    {plans.map((plan) => (
                      <Dropdown.Item
                        key={plan.id}
                        id={plan.id}
                        textValue={plan.name}
                      >
                        <Dropdown.ItemIndicator />
                        <div className="min-w-0">
                          <Label>
                            {plan.name}
                            {plan.popular ? " · Popular" : ""}
                          </Label>
                          <Description>
                            {plan.bestFor} · {formatMailIqD(plan.priceMonthly)}/mo
                          </Description>
                        </div>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Section>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)]">Mailbox seats</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                {included} included
                {clampedSeats > included
                  ? ` · +${clampedSeats - included} extra`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                aria-label="Fewer mailbox seats"
                isDisabled={busy || paying || clampedSeats <= included}
                onPress={() => setSeats(clampedSeats - 1)}
              >
                <Minus className="size-3.5" aria-hidden />
              </Button>
              <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-[var(--foreground)]">
                {clampedSeats}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                aria-label="More mailbox seats"
                isDisabled={busy || paying || clampedSeats >= 500}
                onPress={() => setSeats(clampedSeats + 1)}
              >
                <Plus className="size-3.5" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[var(--muted-foreground)]">Estimated monthly</p>
              <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {formatMailIqD(monthlyTotal)}
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  /mo
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                isDisabled={ticketLocked}
                onPress={() => void onRequestPlan()}
              >
                {busy
                  ? "Sending…"
                  : pendingRequest
                    ? "Request pending"
                    : active
                      ? "Request change"
                      : "Request ticket"}
              </Button>
              <Button
                size="sm"
                className="rounded-full shadow-none"
                isDisabled={checkoutLocked}
                onPress={() => void onPayPlan()}
              >
                {paying ? "Opening Checkout…" : `Checkout · ${formatMailIqD(monthlyTotal)}`}
              </Button>
            </div>
          </div>
        </BillingPanel>
      ) : null}

      {!needsApp && !canManageBilling && !loading ? (
        <BillingNotice
          tone="info"
          title="Billing managed by owner"
          description="Ask the workspace owner, admin, or billing contact to request or change the plan."
        />
      ) : null}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full shadow-none"
          onPress={() => router.push("/pricing")}
        >
          Compare all plans
        </Button>
      </div>
    </BillingSection>
  );
}
