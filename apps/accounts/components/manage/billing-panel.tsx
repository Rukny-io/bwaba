"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpCircle,
  Blocks,
  Calendar,
  CreditCard,
  Receipt,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchSubscription } from "@/lib/manage/api";
import type { SubscriptionDetails } from "@/lib/manage/types";
import {
  ManageGroup,
  ManageIconCircle,
  ManageInfoRow,
  ManageListItem,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSpinner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";

function BillingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="px-0.5 text-sm font-medium text-foreground">{title}</h2>
      {description && (
        <p className="mt-1 px-0.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const KNOWN_PLANS = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"] as const;
const KNOWN_STATUSES = ["active", "cancelled", "canceled", "past_due", "trialing"] as const;
const KNOWN_CYCLES = ["monthly", "yearly", "annual"] as const;

function resolvePlanDesc(
  t: ReturnType<typeof useTranslations<"Manage">>,
  plan: string,
): string {
  const normalized = plan.trim().toUpperCase().replace(/\s+/g, "_");
  if ((KNOWN_PLANS as readonly string[]).includes(normalized)) {
    return t(`billing.plans.${normalized}.desc` as "billing.plans.FREE.desc");
  }
  return t("billing.plans.default.desc");
}

function resolveStatus(
  t: ReturnType<typeof useTranslations<"Manage">>,
  status: string,
): string {
  const key = status.toLowerCase();
  if ((KNOWN_STATUSES as readonly string[]).includes(key)) {
    return t(`billing.status.${key}` as "billing.status.active");
  }
  return status;
}

function resolveCycle(
  t: ReturnType<typeof useTranslations<"Manage">>,
  cycle: string,
): string {
  const key = cycle.toLowerCase();
  if ((KNOWN_CYCLES as readonly string[]).includes(key)) {
    return t(`billing.cycles.${key}` as "billing.cycles.monthly");
  }
  return cycle;
}

function isFreePlan(plan: string): boolean {
  return plan.trim().toUpperCase() === "FREE";
}

function BillingActionStatic({
  icon,
  tone,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon;
  tone: "purple" | "blue" | "teal" | "orange" | "green";
  title: string;
  subtitle: string;
  badge: string;
}) {
  const Icon = icon;
  return (
    <ManageRow>
      <div className="flex min-w-0 items-center gap-3">
        <ManageIconCircle icon={Icon} tone={tone} muted />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {badge}
      </Badge>
    </ManageRow>
  );
}

export function BillingPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubscription(await fetchSubscription());
    } catch {
      setError(t("billing.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "ar" ? "ar-IQ" : undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const planDesc = subscription ? resolvePlanDesc(t, subscription.plan) : "";

  const billingCycleLabel = subscription?.billingCycle
    ? resolveCycle(t, subscription.billingCycle)
    : null;

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("billing.title")}
        description={t("billing.description")}
        className="hidden lg:block"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : subscription ? (
        <>
          <BillingSection
            title={t("billing.section_plan.title")}
            description={t("billing.section_plan.description")}
          >
            <ManageGroup>
              <div className="flex gap-3 px-4 py-4">
                <ManageIconCircle icon={CreditCard} tone="purple" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium">{subscription.plan}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {resolveStatus(t, subscription.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{planDesc}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isFreePlan(subscription.plan)
                      ? t("billing.free_plan")
                      : subscription.currentPeriodEnd
                        ? `${t("billing.renews")} ${formatDate(subscription.currentPeriodEnd)}`
                        : t("billing.no_renewal_date")}
                  </p>
                </div>
              </div>
              {subscription.cancelledAt && (
                <div className={cn("px-4 py-3 text-sm text-amber-600", ui.divider)}>
                  {t("billing.cancel_pending")}
                </div>
              )}
            </ManageGroup>
          </BillingSection>

          <BillingSection
            title={t("billing.section_details.title")}
            description={t("billing.section_details.description")}
          >
            <ManageGroup>
              {billingCycleLabel && (
                <ManageInfoRow
                  icon={Calendar}
                  label={t("billing.billing_cycle")}
                  value={billingCycleLabel}
                />
              )}
              {subscription.currentPeriodStart && (
                <ManageInfoRow
                  icon={Calendar}
                  label={t("billing.period_start")}
                  value={formatDate(subscription.currentPeriodStart)}
                />
              )}
              {subscription.currentPeriodEnd && !isFreePlan(subscription.plan) && (
                <ManageInfoRow
                  icon={Calendar}
                  label={t("billing.period_end")}
                  value={formatDate(subscription.currentPeriodEnd)}
                />
              )}
              {!billingCycleLabel &&
                !subscription.currentPeriodStart &&
                !subscription.currentPeriodEnd && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("billing.no_billing_details")}
                  </div>
                )}
            </ManageGroup>
          </BillingSection>

          <BillingSection
            title={t("billing.section_actions.title")}
            description={t("billing.section_actions.description")}
          >
            <ManageGroup>
              <BillingActionStatic
                icon={ArrowUpCircle}
                tone="purple"
                title={t("billing.actions.upgrade")}
                subtitle={t("billing.actions.upgrade_desc")}
                badge={t("billing.coming_soon")}
              />
              <BillingActionStatic
                icon={Wallet}
                tone="blue"
                title={t("billing.actions.payment_methods")}
                subtitle={t("billing.actions.payment_methods_desc")}
                badge={t("billing.coming_soon")}
              />
              <BillingActionStatic
                icon={Receipt}
                tone="teal"
                title={t("billing.actions.invoices")}
                subtitle={t("billing.actions.invoices_desc")}
                badge={t("billing.coming_soon")}
              />
              <ManageListItem
                icon={Blocks}
                tone="orange"
                title={t("billing.actions.linked_apps")}
                subtitle={t("billing.actions.linked_apps_desc")}
                href="/manage/linked-apps"
              />
            </ManageGroup>
          </BillingSection>
        </>
      ) : null}
    </ManagePageStack>
  );
}
