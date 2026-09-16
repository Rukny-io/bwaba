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
import { MailNotice } from "@/components/app/mail-notice";
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
  type MailPendingPlanRequest,
  type MailSubscriptionView,
} from "@/lib/mail-subscription-client";

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
  const [pendingRequest, setPendingRequest] = useState<MailPendingPlanRequest | null>(
    null,
  );
  const [appName, setAppName] = useState<string | null>(null);
  const [needsApp, setNeedsApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
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
    setNeedsApp(current.needsApp);
    setAppName(current.app?.name ?? null);
    setSubscription(current.subscription);
    setPendingRequest(current.pendingRequest);

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
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );
  const included = selectedPlan ? includedFor(selectedPlan) : 1;
  const clampedSeats = Math.max(included, Math.min(500, seats));
  const monthlyTotal = selectedPlan
    ? mailPlanMonthlyTotal(selectedPlan.id, clampedSeats)
    : 0;
  const requestLocked = needsApp || Boolean(pendingRequest) || busy || !selectedPlan;

  function onSelectPlan(planId: MailPlanId) {
    const plan = plans.find((entry) => entry.id === planId);
    if (!plan) return;
    const nextIncluded = includedFor(plan);
    setSelectedPlanId(planId);
    setSeats((prev) => Math.max(nextIncluded, prev));
  }

  async function onRequestPlan() {
    if (!selectedPlan || requestLocked) return;
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

  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Plan</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {appName
              ? `Seats and storage apply only to ${appName}.`
              : "Seats and storage apply only to the workspace you have open."}{" "}
            Card payment is coming soon.
          </p>
        </div>
        {loading ? null : (
          <Chip
            color={active ? "success" : pendingRequest ? "warning" : "default"}
            size="sm"
            variant="soft"
          >
            {active ? active.planName : pendingRequest ? "Pending" : "No plan"}
          </Chip>
        )}
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {success ? (
        <MailNotice
          status="success"
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
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
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
              <dt className="text-[var(--muted-foreground)]">Storage</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {active.limits.storageGbPerMailbox} GB for emails
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Forwarding</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {active.limits.forwardingRules} rules
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted-foreground)]">Aliases / mailbox</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {formatMailAliasLimit(active.limits.emailAliases)}
              </dd>
            </div>
          </dl>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
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
        <p className="text-sm text-[var(--muted-foreground)]">
          No paid plan on this workspace yet. Starter starts after DNS is verified.
          Request Standard or Premium below — an admin will activate it.
        </p>
      )}

      {pendingRequest ? (
        <MailNotice
          status="warning"
          title="Request pending"
          description={`Ticket ${pendingRequest.ticketNumber}${
            pendingRequest.plan ? ` · ${pendingRequest.plan}` : ""
          } · ${pendingRequest.mailboxCount} seat${
            pendingRequest.mailboxCount === 1 ? "" : "s"
          }. An admin will activate this workspace plan.`}
        />
      ) : null}

      {!needsApp && plans.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-[var(--surface-secondary)] p-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Request a subscription
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Choose a plan and mailbox seats for this workspace. We open a ticket for
              admin activation.
            </p>
          </div>

          <div className="min-w-0">
            <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Plan
            </Label>
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Select plan"
                isDisabled={Boolean(pendingRequest) || busy}
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
                isDisabled={
                  Boolean(pendingRequest) || busy || clampedSeats <= included
                }
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
                isDisabled={Boolean(pendingRequest) || busy || clampedSeats >= 500}
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
            <Button
              size="sm"
              isDisabled={requestLocked}
              onPress={() => void onRequestPlan()}
            >
              {busy
                ? "Sending…"
                : pendingRequest
                  ? "Request pending"
                  : active
                    ? "Request plan change"
                    : "Request subscription"}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onPress={() => router.push("/pricing")}>
          Compare all plans
        </Button>
      </div>
    </div>
  );
}
