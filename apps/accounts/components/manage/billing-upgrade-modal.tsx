"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Modal, Switch, useOverlayState } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { PlanOverview, SubscriptionDetails } from "@/lib/manage/types";
import { createSupportTicket } from "@/lib/manage/api";
import { cn } from "@/lib/utils";
import { ManageNotice } from "./manage-ui";

const PLAN_ORDER = ["FREE", "PRO", "WHALE", "BUSINESS"] as const;

function planRank(plan: string): number {
  const idx = PLAN_ORDER.indexOf(plan.toUpperCase() as (typeof PLAN_ORDER)[number]);
  return idx === -1 ? 0 : idx;
}

function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-IQ").format(amount);
}

interface BillingUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlanOverview[];
  subscription: SubscriptionDetails;
  onTicketCreated: (ticketNumber: string) => void;
}

export function BillingUpgradeModal({
  open,
  onOpenChange,
  plans,
  subscription,
  onTicketCreated,
}: BillingUpgradeModalProps) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const modalState = useOverlayState({ isOpen: open, onOpenChange });
  const [yearly, setYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRank = planRank(subscription.plan);

  const upgradablePlans = useMemo(
    () => plans.filter((p) => p.id !== "FREE" && planRank(p.id) > currentRank),
    [plans, currentRank],
  );

  const handleSubmitTicket = async () => {
    if (!selectedPlan) return;
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    const billingCycle = yearly ? "YEARLY" : "MONTHLY";
    const cycleLabel = yearly ? t("billing.cycles.yearly") : t("billing.cycles.monthly");
    const planName = locale === "ar" ? plan.name : plan.nameEn;
    const price = yearly ? plan.price.yearly : plan.price.monthly;

    setLoading(true);
    setError(null);
    try {
      const ticket = await createSupportTicket({
        subject: t("billing.upgrade_ticket_subject", { plan: planName, cycle: cycleLabel }),
        description: t("billing.upgrade_ticket_description", {
          currentPlan: subscription.plan,
          requestedPlan: planName,
          cycle: cycleLabel,
          price: formatPrice(price, locale),
        }),
        category: "BILLING",
        context: {
          page: "/manage/billing",
          locale,
          source: "billing_upgrade",
          currentPlan: subscription.plan,
          requestedPlan: selectedPlan,
          billingCycle,
        },
      });
      onTicketCreated(ticket.number);
      modalState.close();
      setSelectedPlan(null);
    } catch {
      setError(t("billing.upgrade_ticket_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Modal.Backdrop>
        <Modal.Container size="lg" className="manage-billing-modal">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className="manage-billing-modal-header">
              <Modal.Heading>{t("billing.upgrade_modal_title")}</Modal.Heading>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t("billing.upgrade_modal_desc")}
              </p>
            </Modal.Header>

            <Modal.Body className="manage-billing-modal-body space-y-3">
              <ManageNotice>
                {t("billing.upgrade_support_notice")}
              </ManageNotice>

              <div className="manage-surface px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {t("billing.billing_cycle_label")}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "transition-colors",
                        !yearly ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t("billing.cycles.monthly")}
                    </span>
                    <Switch
                      isSelected={yearly}
                      onChange={setYearly}
                      aria-label={t("billing.billing_cycle_label")}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    <span
                      className={cn(
                        "transition-colors",
                        yearly ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t("billing.cycles.yearly")}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2.5">
                {upgradablePlans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  const price = yearly ? plan.price.yearly : plan.price.monthly;
                  const planName = locale === "ar" ? plan.name : plan.nameEn;
                  const planDescKey = `billing.plans.${plan.id}.desc` as const;
                  const priceLabel = yearly
                    ? t("billing.yearly_price", { price: formatPrice(price, locale) })
                    : t("billing.monthly_price", { price: formatPrice(price, locale) });

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      aria-pressed={isSelected}
                      className={cn(
                        "manage-surface w-full px-5 py-4 text-start transition-colors",
                        "hover:border-border hover:bg-muted/25",
                        isSelected && "border-primary/45 bg-primary/5 shadow-[inset_0_0_0_1px] shadow-primary/20",
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={cn(
                            "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/80 bg-background",
                          )}
                          aria-hidden
                        >
                          {isSelected ? <Check className="size-2.5" strokeWidth={3} /> : null}
                        </span>

                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-foreground">{planName}</h3>
                              {subscription.plan.toUpperCase() === plan.id && (
                                <span className="manage-badge-verified inline-flex h-5 items-center rounded-full px-2 text-[10px]">
                                  {t("billing.current_badge")}
                                </span>
                              )}
                            </div>
                            <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                              {priceLabel}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {t(planDescKey)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Modal.Body>

            <Modal.Footer className="manage-billing-modal-footer">
              <Button variant="outline" className="rounded-3xl" onClick={() => modalState.close()}>
                {t("cancel")}
              </Button>
              <Button
                className="rounded-3xl"
                disabled={!selectedPlan || loading}
                onClick={handleSubmitTicket}
              >
                {loading ? t("billing.processing") : t("billing.upgrade_ticket_action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
