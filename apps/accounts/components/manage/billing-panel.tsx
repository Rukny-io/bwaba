"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowUpCircle,
  Blocks,
  Calendar,
  CreditCard,
  ExternalLink,
  Receipt,
  XCircle,
} from "lucide-react";
import { Modal, useOverlayState } from "@heroui/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  cancelSubscription,
  fetchPlans,
  fetchSubscription,
  fetchSubscriptionPayments,
} from "@/lib/manage/api";
import type {
  PlanOverview,
  SubscriptionDetails,
  SubscriptionPayment,
} from "@/lib/manage/types";
import { BillingUpgradeModal } from "./billing-upgrade-modal";
import {
  ManageEmptyState,
  ManageGroup,
  ManageIconCircle,
  ManageInfoRow,
  ManageLinkButton,
  ManageListItem,
  ManageNotice,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSection,
  ManageSpinner,
  ManageSuccessBanner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";
import { status } from "@/lib/status-colors";

const KNOWN_PLANS = ["FREE", "PRO", "WHALE", "BUSINESS", "ENTERPRISE"] as const;
const KNOWN_STATUSES = ["active", "cancelled", "canceled", "past_due", "trialing", "expired"] as const;
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
  value: string,
): string {
  const key = value.toLowerCase();
  if ((KNOWN_STATUSES as readonly string[]).includes(key)) {
    return t(`billing.status.${key}` as "billing.status.active");
  }
  return value;
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

function paymentStatusVariant(
  paymentStatus: string,
): "secondary" | "outline" | "destructive" {
  if (paymentStatus === "COMPLETED") return "secondary";
  if (paymentStatus === "FAILED") return "destructive";
  return "outline";
}

function PaymentRow({
  payment,
  locale,
  t,
}: {
  payment: SubscriptionPayment;
  locale: string;
  t: ReturnType<typeof useTranslations<"Manage">>;
}) {
  const date = payment.paidAt || payment.createdAt;
  const formattedDate = new Date(date).toLocaleDateString(
    locale === "ar" ? "ar-IQ" : undefined,
    { year: "numeric", month: "short", day: "numeric" },
  );
  const formattedAmount = new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-IQ").format(
    payment.amount,
  );
  const statusKey = payment.status as "COMPLETED" | "PENDING" | "FAILED";
  const statusLabel = t(`billing.payment_status.${statusKey}` as "billing.payment_status.COMPLETED");

  return (
    <ManageRow>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ManageIconCircle icon={Receipt} tone="blue" muted />
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums">
            {formattedAmount} {locale === "ar" ? "د.ع" : "IQD"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={paymentStatusVariant(payment.status)} className="text-[10px]">
          {statusLabel}
        </Badge>
        {payment.receiptUrl ? (
          <a
            href={payment.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label={t("billing.view_receipt")}
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
          </a>
        ) : null}
      </div>
    </ManageRow>
  );
}

export function BillingPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<PlanOverview[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const cancelModal = useOverlayState();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, plansData, paymentsData] = await Promise.all([
        fetchSubscription(),
        fetchPlans().then((r) => r.plans).catch(() => [] as PlanOverview[]),
        fetchSubscriptionPayments().then((r) => r.payments).catch(() => []),
      ]);
      setSubscription(sub);
      setPlans(plansData);
      setPayments(paymentsData);
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

  const canCancel = subscription && !isFreePlan(subscription.plan) && !subscription.cancelledAt;

  const handleCancel = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      await cancelSubscription();
      setSuccess(t("billing.cancel_success"));
      cancelModal.close();
      await load();
    } catch {
      setError(t("billing.cancel_error"));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgradeTicketCreated = (ticketNumber: string) => {
    setSuccess(t("billing.upgrade_ticket_success", { number: ticketNumber }));
  };

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("billing.title")}
        titleShort={t("nav.billing_short")}
        description={t("billing.description")}
      />

      {success && <ManageSuccessBanner>{success}</ManageSuccessBanner>}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <ManageSpinner />
      ) : subscription ? (
        <>
          <ManageSection title={t("billing.section_plan.title")}>
            <ManageGroup>
              <div className={cn("flex gap-3.5 px-5 py-4", ui.divider)}>
                <ManageIconCircle icon={CreditCard} tone="purple" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-medium">{subscription.plan}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {resolveStatus(t, subscription.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {planDesc}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {isFreePlan(subscription.plan)
                      ? t("billing.free_plan")
                      : subscription.currentPeriodEnd
                        ? `${t("billing.renews")} ${formatDate(subscription.currentPeriodEnd)}`
                        : t("billing.no_renewal_date")}
                  </p>
                </div>
              </div>

              {subscription.cancelledAt && (
                <div className={cn("px-5 py-3 text-sm", status.warning, ui.divider)}>
                  {t("billing.cancel_pending")}
                </div>
              )}

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
            </ManageGroup>
          </ManageSection>

          <ManageSection title={t("billing.section_invoices.title")}>
            {payments.length > 0 ? (
              <ManageGroup>
                {payments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    locale={locale}
                    t={t}
                  />
                ))}
              </ManageGroup>
            ) : (
              <ManageEmptyState
                icon={Receipt}
                title={t("billing.invoices_empty")}
                description={t("billing.invoices_empty_desc")}
                action={
                  <Button onClick={() => setUpgradeOpen(true)}>
                    {t("billing.invoices_request_upgrade")}
                  </Button>
                }
              />
            )}
          </ManageSection>

          <ManageSection title={t("billing.section_actions.title")}>
            <ManageNotice>{t("billing.payment_methods_info")}</ManageNotice>
            <ManageGroup>
              <ManageListItem
                icon={ArrowUpCircle}
                tone="purple"
                title={t("billing.actions.upgrade")}
                subtitle={t("billing.actions.upgrade_desc_support")}
                onClick={() => setUpgradeOpen(true)}
              />
              {canCancel && (
                <ManageListItem
                  icon={XCircle}
                  tone="red"
                  title={t("billing.actions.cancel")}
                  subtitle={t("billing.actions.cancel_desc")}
                  onClick={() => cancelModal.open()}
                />
              )}
              <ManageListItem
                icon={Blocks}
                tone="orange"
                title={t("billing.actions.linked_apps")}
                subtitle={t("billing.actions.linked_apps_desc")}
                href="/manage/linked-apps"
              />
            </ManageGroup>
          </ManageSection>

          <BillingUpgradeModal
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            plans={plans}
            subscription={subscription}
            onTicketCreated={handleUpgradeTicketCreated}
          />

          <Modal state={cancelModal}>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>{t("billing.cancel_confirm_title")}</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("billing.cancel_confirm_desc")}
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="outline" onClick={() => cancelModal.close()}>
                      {t("billing.cancel_keep")}
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={cancelLoading}
                      onClick={handleCancel}
                    >
                      {cancelLoading ? t("billing.processing") : t("billing.cancel_confirm_action")}
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </>
      ) : !error ? (
        <ManageEmptyState
          icon={CreditCard}
          title={t("billing.empty_title")}
          description={t("billing.empty_desc")}
          action={
            <ManageLinkButton href="/manage/support/tickets/new">
              {t("billing.empty_cta")}
            </ManageLinkButton>
          }
        />
      ) : null}
    </ManagePageStack>
  );
}
