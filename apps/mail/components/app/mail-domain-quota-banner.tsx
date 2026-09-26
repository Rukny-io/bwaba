"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMailDomainQuotaClient,
  type MailDomainQuota,
} from "@/lib/mail-domain-quota-client";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { usePathname } from "next/navigation";

type MailDomainQuotaBannerProps = {
  domain?: string;
  compact?: boolean;
};

export function MailDomainQuotaBanner({
  domain,
  compact = false,
}: MailDomainQuotaBannerProps) {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const pricingHref = withMailSlot("/pricing", slot);

  const [quota, setQuota] = useState<MailDomainQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchMailDomainQuotaClient(appId, domain);
        if (!cancelled) setQuota(next);
      } catch {
        if (!cancelled) setQuota(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain]);

  if (loading || !quota) return null;

  const atLimit = quota.remaining <= 0;
  const blocked = domain ? quota.canAttach === false : atLimit;

  if (compact) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Domains on your account:{" "}
        <span className="font-medium text-[var(--foreground)]">
          {quota.used} / {quota.limit}
        </span>
        {blocked ? (
          <>
            {" "}
            ·{" "}
            <Link href={pricingHref} className="font-medium text-[var(--primary)] underline">
              Upgrade
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div
      className={
        blocked
          ? "rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-4 py-3"
          : "rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {quota.used} / {quota.limit} domains used
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {quota.marketingNameEn} plan · shared across your Mail workspaces and Email API.
          </p>
        </div>
        {blocked ? (
          <Link
            href={pricingHref}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-semibold text-[var(--background)]"
          >
            Upgrade plan
          </Link>
        ) : (
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            {quota.remaining} remaining
          </span>
        )}
      </div>
    </div>
  );
}
