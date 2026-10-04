"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  Globe,
  HardDrive,
  Inbox,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MailPlanStatTile, MailPlanUsageBar } from "@/components/apps/mail-plan-stat-tile";
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
  return date.toLocaleDateString("en-CA");
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
  const mailboxFull = mailboxLimit > 0 && activeMailboxCount >= mailboxLimit;

  const BillingCta = externalBilling ? (
    <a
      href={billingHref}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
    >
      {billingLabel}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </a>
  ) : (
    <Link
      href={billingHref}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
    >
      {billingLabel}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );

  if (!loading && !hasActivePlan) {
    return (
      <section
        className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 sm:p-5"
        role="region"
        aria-label="Email plan"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Globe className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {domain}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
              Domain is ready. Finish DNS verification to activate your free plan and unlock
              mailboxes.
            </p>
          </div>
          <Link
            href={billingHref}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            View plans
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]"
      role="region"
      aria-label="Email plan"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
                <h2 className="truncate text-base font-semibold text-[var(--foreground)] sm:text-[17px]">
                  {domain}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--background)] uppercase">
                  {loading ? "…" : planLabel(subscription)}
                </span>
                {unifiedPlan ? (
                  <span className="rounded-full bg-[var(--background)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                    Unified billing
                  </span>
                ) : null}
                {mailboxFull ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] px-2.5 py-0.5 text-[10px] font-medium text-[var(--warning)]">
                    Mailbox limit reached
                  </span>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <MailPlanStatTile
                icon={Inbox}
                label="Mailboxes"
                value={
                  loading
                    ? "…"
                    : mailboxLimit > 0
                      ? `${activeMailboxCount} / ${mailboxLimit}`
                      : String(activeMailboxCount)
                }
                hint={
                  mailboxLimit > 0
                    ? `${Math.max(0, mailboxLimit - activeMailboxCount)} slot${
                        mailboxLimit - activeMailboxCount === 1 ? "" : "s"
                      } left`
                    : undefined
                }
                warning={mailboxFull}
              />
              {limits ? (
                <MailPlanStatTile
                  icon={HardDrive}
                  label="Storage"
                  value={`${limits.storageGbPerMailbox} GB`}
                  hint="per mailbox"
                />
              ) : null}
              <MailPlanStatTile
                icon={Calendar}
                label="Renews"
                value={loading ? "…" : formatRenewalDate(subscription?.renewsAt)}
                hint="billing period"
              />
              {outboundMonthly != null ? (
                <MailPlanStatTile
                  icon={Send}
                  label="Outbound"
                  value={outboundMonthly.toLocaleString("en-IQ")}
                  hint="included / month"
                />
              ) : null}
            </div>

            {mailboxLimit > 0 ? (
              <MailPlanUsageBar
                label="Mailbox usage"
                used={activeMailboxCount}
                limit={mailboxLimit}
                warning={mailboxFull}
              />
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
            <button
              type="button"
              onClick={onToggleLimits}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
              aria-expanded={limitsOpen}
            >
              Plan limits
              <ChevronDown
                className={cn("size-4 transition-transform", limitsOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {BillingCta}
          </div>
        </div>

        {limitsOpen && limits ? (
          <div className="border-t border-[var(--border)] pt-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Forwarding
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">
                  {limits.forwardingRules}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Aliases
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">
                  {formatMailAliasLimit(limits.emailAliases)} / mailbox
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Filter rules
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">
                  {limits.filterRules}
                </dd>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                  Console seats
                </dt>
                <dd className="mt-1 font-semibold text-[var(--foreground)]">
                  {limits.consoleMembersIncluded === 0
                    ? "Owner only"
                    : limits.consoleMembersIncluded}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              DNS and domain verification live in{" "}
              <Link
                href={domainSettingsHref}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                Domain settings
              </Link>
              .
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
