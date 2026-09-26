"use client";

import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { appToast } from "@/lib/app-toast";
import { useCurrentApp } from "@/components/providers/app-context";
import {
  getEmailSubscription,
  purchaseEmailOverage,
} from "@/lib/api/email-api";
import { EMAIL_OVERAGE_PACK, formatPrice } from "@/lib/pricing-plans";
import { redirectToDeveloperCheckout } from "@/lib/developer-checkout";

type UpgradePlan = {
  id: string;
  label: string;
  price: number;
  quota: number;
};

export function EmailApiSubscriptionCard() {
  const { app } = useCurrentApp();
  const queryClient = useQueryClient();
  const subscription = useQuery({
    queryKey: ["email-api", app.appId, "subscription"],
    queryFn: () => getEmailSubscription(app.appId),
  });
  const buyOverage = useMutation({
    mutationFn: () => purchaseEmailOverage(app.appId, 1),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["email-api", app.appId, "subscription"],
      });
      appToast.success("Overage pack added to your account.");
    },
    onError: (error) =>
      appToast.fromError(error, "Could not purchase overage pack."),
  });
  const data = subscription.data;
  const planLabel = data?.plan?.name ?? "Starter";
  const planPrice = data?.plan?.priceIqd ?? 0;
  const planQuota = data?.subscription?.quota || data?.free?.quota || 3_000;

  const upgradePlans: UpgradePlan[] = (data?.catalog?.transactional ?? [])
    .filter(
      (plan: { id: string; priceMonthlyIqd: number }) =>
        plan.id !== "FREE" && plan.priceMonthlyIqd > 0,
    )
    .slice(0, 3)
    .map(
      (plan: {
        id: string;
        marketingNameEn: string;
        priceMonthlyIqd: number;
        monthlyQuota: number;
      }) => ({
        id: plan.id,
        label: plan.marketingNameEn,
        price: plan.priceMonthlyIqd,
        quota: plan.monthlyQuota,
      }),
    );

  return (
    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Mail + Email API plan</h2>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
            {data
              ? `${planLabel} · ${formatPrice(planPrice)} IQD/mo · ${formatPrice(planQuota)} msgs`
              : "3,000 free emails / month · Growth 16,000 IQD/mo"}
          </p>
        </div>
        <Link
          href="/pricing/compare-resend"
          className="text-[13px] font-medium underline underline-offset-2"
        >
          Compare with Resend
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {upgradePlans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() =>
              void redirectToDeveloperCheckout({
                kind: "EMAIL_API_PLAN",
                appId: app.appId,
                planId: plan.id,
              }).catch((error) =>
                appToast.fromError(error, "Could not start checkout."),
              )
            }
            className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] px-3 text-[12px] font-medium disabled:opacity-60"
          >
            Upgrade to {plan.label}
          </button>
        ))}
        <button
          type="button"
          disabled={buyOverage.isPending}
          onClick={() => buyOverage.mutate()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-[12px] font-medium text-[var(--background)] disabled:opacity-60"
        >
          {buyOverage.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : null}
          Buy {formatPrice(EMAIL_OVERAGE_PACK.emails)} pack ·{" "}
          {formatPrice(EMAIL_OVERAGE_PACK.priceIqd)} IQD
        </button>
      </div>

      {data ? (
        <div className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
            <p className="text-[var(--muted-foreground)]">Free tier</p>
            <p className="mt-1 font-semibold">
              {(data.free?.remaining ?? data.trial?.remaining ?? 0).toLocaleString()} /{" "}
              {(data.free?.quota ?? data.trial?.quota ?? 3000).toLocaleString()} · daily{" "}
              {data.free?.dailyRemaining ?? "100"}/{data.free?.dailyLimit ?? 100}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
            <p className="text-[var(--muted-foreground)]">Paid subscription</p>
            <p className="mt-1 font-semibold capitalize">
              {data.subscription.status} ·{" "}
              {data.subscription.remaining.toLocaleString()} remaining
            </p>
          </div>
          {data.marketing ? (
          <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
            <p className="text-[var(--muted-foreground)]">Marketing contacts</p>
            <p className="mt-1 font-semibold">
              {(data.marketing.name ?? data.marketing.plan).toString()} ·{" "}
              {data.marketing.contactsRemaining.toLocaleString()} remaining
            </p>
          </div>
          ) : null}
          {data.domains ? (
            <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
              <p className="text-[var(--muted-foreground)]">Sending domains</p>
              <p className="mt-1 font-semibold">
                {data.domains.used.toLocaleString()} /{" "}
                {data.domains.limit.toLocaleString()} used
              </p>
            </div>
          ) : null}
          <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
            <p className="text-[var(--muted-foreground)]">Automation runs</p>
            <p className="mt-1 font-semibold">
              {data.automations.remaining.toLocaleString()} /{" "}
              {data.automations.included.toLocaleString()}
            </p>
          </div>
        </div>
      ) : subscription.isLoading ? (
        <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">
          Loading subscription…
        </p>
      ) : null}
    </section>
  );
}
