"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MailPlanUsageBar } from "@/components/apps/mail-plan-stat-tile";
import { formatMailAliasLimit, MAIL_INCLUDED_OUTBOUND } from "@/lib/mail-plans";
import type { MailPlanLimits } from "@/lib/mail-plans";
import type {
  MailSubscriptionView,
  MailUnifiedPlanSnapshot,
} from "@/lib/mail-subscription-client";

function formatRenewalDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function planLabel(subscription: MailSubscriptionView | null): string {
  if (!subscription) return "No active plan";
  const base = (subscription.planName || subscription.planId || "").trim();
  return base || "No active plan";
}

export function MailMailboxesPlanPanel({
  domain,
  loading,
  hasActivePlan,
  subscription,
  unifiedPlan,
  limits,
  limitsOpen,
  onToggleLimits,
  activeMailboxCount,
  seatLimit,
  billingHref,
  billingLabel,
  externalBilling,
  domainSettingsHref,
}: {
  domain: string;
  loading: boolean;
  hasActivePlan: boolean;
  subscription: MailSubscriptionView | null;
  unifiedPlan: MailUnifiedPlanSnapshot | null;
  limits?: MailPlanLimits;
  limitsOpen: boolean;
  onToggleLimits: () => void;
  activeMailboxCount: number;
  seatLimit: number;
  billingHref: string;
  billingLabel: string;
  externalBilling?: boolean;
  domainSettingsHref: string;
}) {
  const outboundMonthly =
    unifiedPlan?.monthlyQuota ??
    (subscription?.planId ? MAIL_INCLUDED_OUTBOUND[subscription.planId] : null);
  const mailboxLimit = seatLimit || limits?.mailboxesIncluded || 0;
  const panelClass = "rounded-2xl bg-[var(--surface)] p-4 sm:p-5";

  if (!loading && !hasActivePlan) {
    return (
      <div className={panelClass} role="status">
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--foreground)]">{domain}</span>
          {" — verify DNS to activate your free plan. "}
          <Link
            href={domainSettingsHref}
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Domain settings
          </Link>
        </p>
      </div>
    );
  }

  const BillingLink = externalBilling ? (
    <a
      href={billingHref}
      className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
    >
      {billingLabel}
    </a>
  ) : (
    <Link
      href={billingHref}
      className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
    >
      {billingLabel}
    </Link>
  );

  const planPills: { key: string; label: string }[] = [];
  if (limits) {
    planPills.push({
      key: "storage",
      label: `${limits.storageGbPerMailbox} GB / mailbox`,
    });
  }
  if (outboundMonthly != null) {
    planPills.push({
      key: "sends",
      label: `${outboundMonthly.toLocaleString("en-IQ")} sends / mo`,
    });
  }

  return (
    <div className={cn(panelClass, "space-y-3")} role="region" aria-label="Email plan">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-base font-medium text-[var(--foreground)]">{domain}</p>
          <p className="text-sm text-[var(--muted-foreground)]">
            {loading ? "…" : planLabel(subscription)}
            {!loading && subscription?.renewsAt ? (
              <>
                {" · Renews "}
                <span className="tabular-nums">
                  {formatRenewalDate(subscription.renewsAt)}
                </span>
              </>
            ) : null}
          </p>
          {!loading && planPills.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-[13px] text-[var(--muted-foreground)]">
              {planPills.map((pill) => (
                <span
                  key={pill.key}
                  className="rounded-full bg-[var(--surface-secondary)] px-3 py-1"
                >
                  {pill.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <button
            type="button"
            onClick={onToggleLimits}
            className="inline-flex items-center gap-0.5 font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            aria-expanded={limitsOpen}
          >
            Limits
            <ChevronDown
              className={cn("size-3.5 transition-transform", limitsOpen && "rotate-180")}
              aria-hidden
            />
          </button>
          {BillingLink}
        </div>
      </div>

      {mailboxLimit > 0 ? (
        <MailPlanUsageBar
          label="Mailboxes"
          used={activeMailboxCount}
          limit={mailboxLimit}
          warning={activeMailboxCount >= mailboxLimit}
        />
      ) : null}

      {limitsOpen && limits ? (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Forwarding</dt>
            <dd className="font-medium text-[var(--foreground)]">{limits.forwardingRules}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Aliases</dt>
            <dd className="font-medium text-[var(--foreground)]">
              {formatMailAliasLimit(limits.emailAliases)} / mailbox
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Filter rules</dt>
            <dd className="font-medium text-[var(--foreground)]">{limits.filterRules}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--muted-foreground)]">Console seats</dt>
            <dd className="font-medium text-[var(--foreground)]">
              {limits.consoleMembersIncluded === 0
                ? "Owner only"
                : limits.consoleMembersIncluded}
            </dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
