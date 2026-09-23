"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Description, Input, Label, Skeleton, TextField } from "@heroui/react";
import {
  BillingNotice,
  BillingPanel,
  BillingSection,
} from "@/components/billing/billing-ui";
import { startMailOutboundPackCheckout } from "@/lib/mail-checkout";
import { formatMailIqD } from "@/lib/mail-plans";
import {
  fetchMailOutboundUsage,
  type MailOutboundUsageView,
} from "@/lib/mail-usage-client";

export function MailUsageSection() {
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<MailOutboundUsageView | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [thousands, setThousands] = useState("1");
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchMailOutboundUsage();
      setUsage(next.usage);
      setCanManage(next.canManageBilling);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load usage.");
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const packPrice = usage?.packPriceIqd ?? null;
  const n = Math.max(1, Math.min(500, Math.floor(Number(thousands) || 1)));
  const total =
    packPrice != null ? n * packPrice : null;
  const emails = n * (usage?.packEmails ?? 1000);

  async function onBuy() {
    if (!usage?.packsAvailable || packPrice == null || !canManage) return;
    setBuying(true);
    setError("");
    try {
      const session = await startMailOutboundPackCheckout(n);
      window.location.assign(session.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBuying(false);
    }
  }

  if (loading) {
    return (
      <BillingSection
        title="Usage"
        description="Outbound emails included in your plan this period."
      >
        <Skeleton className="h-16 w-full rounded-xl" />
      </BillingSection>
    );
  }

  if (!usage) {
    return (
      <BillingSection
        title="Usage"
        description="Outbound emails included in your plan this period."
      >
        <BillingNotice
          tone="info"
          title="No active plan"
          description="Activate a Mail plan to track outbound usage."
        />
        {error ? (
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        ) : null}
      </BillingSection>
    );
  }

  const nearLimit = usage.percentUsed >= 80;

  return (
    <BillingSection
      title="Usage"
      description="Outbound emails sent this billing period (per recipient)."
    >
      {error ? (
        <BillingNotice tone="danger" title="Usage" description={error} />
      ) : null}

      <BillingPanel>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--muted-foreground)]">
              {usage.used.toLocaleString("en-IQ")} of{" "}
              {usage.allowance.toLocaleString("en-IQ")} used
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
              Included {usage.included.toLocaleString("en-IQ")}
              {usage.packCredits > 0
                ? ` · Packs +${usage.packCredits.toLocaleString("en-IQ")}`
                : ""}
              {" · "}
              {usage.remaining.toLocaleString("en-IQ")} remaining
            </p>
          </div>
          <p className="shrink-0 text-sm font-medium tabular-nums text-[var(--foreground)]">
            {usage.percentUsed}%
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
          role="meter"
          aria-valuenow={usage.percentUsed}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Outbound usage"
        >
          <div
            className={`h-full rounded-full transition-all ${
              usage.remaining <= 0
                ? "bg-[var(--danger)]"
                : nearLimit
                  ? "bg-amber-500"
                  : "bg-[var(--foreground)]"
            }`}
            style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
          />
        </div>
      </BillingPanel>

      {usage.remaining <= 0 ? (
        <BillingNotice
          tone="danger"
          title="Quota reached"
          description="Sending is blocked until you buy more emails or a new period starts."
        />
      ) : nearLimit ? (
        <BillingNotice
          tone="info"
          title="Approaching limit"
          description="Buy prepaid packs if you expect more outbound volume this period."
        />
      ) : null}

      {usage.packsAvailable && packPrice != null ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Buy more emails
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {formatMailIqD(packPrice)} per{" "}
              {(usage.packEmails || 1000).toLocaleString("en-IQ")} emails.
              Credits apply to this billing period.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <TextField className="w-full sm:w-36">
              <Label>Packs (×1,000)</Label>
              <Input
                type="number"
                min={1}
                max={500}
                value={thousands}
                onChange={(value) => setThousands(String(value))}
                isDisabled={!canManage || buying}
              />
              <Description>
                {emails.toLocaleString("en-IQ")} emails
                {total != null ? ` · ${formatMailIqD(total)}` : ""}
              </Description>
            </TextField>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              isDisabled={!canManage || buying || n < 1}
              onPress={() => void onBuy()}
            >
              {buying ? "Redirecting…" : "Buy packs"}
            </Button>
          </div>
          {!canManage ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              Only the owner or billing role can purchase packs.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">
          Activate a Mail plan to buy prepaid outbound packs when your quota
          runs out.
        </p>
      )}
    </BillingSection>
  );
}
