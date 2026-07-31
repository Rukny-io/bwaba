"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLocale } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { fetchIdentityStatus, fetchRuknyVerifiedStatus } from "@/lib/manage/api";
import type { IdentityVerificationStatus, RuknyVerifiedStatus } from "@/lib/manage/types";
import { useManage } from "@/lib/manage/context";
import { cn } from "@/lib/utils";
import { status } from "@/lib/status-colors";
import { VerifiedApplyForm } from "./verified-apply-form";
import { IdentityUploadForm } from "./identity-upload-form";
import {
  ManageGroup,
  ManageIconCircle,
  ManagePageHeader,
  ManagePageStack,
  ManageRow,
  ManageSpinner,
  ManageSubheading,
  ui,
} from "./manage-ui";
import { VerifiedDisplayName } from "./verified-badge";

function VerifiedSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <ManageSubheading title={title} description={description} />
      {children}
    </section>
  );
}

function ChecklistRow({
  done,
  pendingReview,
  label,
  hint,
  pendingHint,
  pendingLabel,
  href,
  isRtl,
}: {
  done: boolean;
  pendingReview?: boolean;
  label: string;
  hint?: string;
  pendingHint?: string;
  pendingLabel?: string;
  href?: string;
  isRtl: boolean;
}) {
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const Icon = done ? CheckCircle2 : Circle;

  const content = (
    <ManageRow className={href && !done && !pendingReview ? "transition-colors hover:bg-muted/40" : undefined}>
      <div className="flex min-w-0 items-center gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            done ? status.success : pendingReview ? status.warning : "text-muted-foreground/50",
          )}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {pendingReview && pendingHint ? pendingHint : hint}
          </p>
        </div>
      </div>
      {href && !done && !pendingReview && (
        <Chevron className="size-[18px] shrink-0 text-muted-foreground/45" />
      )}
      {pendingReview && !done && (
        <Badge variant="secondary" className={cn("shrink-0 text-[10px]", status.warningStrong)}>
          {pendingLabel ?? "…"}
        </Badge>
      )}
      {done && (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          ✓
        </Badge>
      )}
    </ManageRow>
  );

  if (href && !done && !pendingReview) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export function VerifiedPanel() {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user, profile, summary } = useManage();

  const [verifiedStatus, setVerifiedStatus] = useState<RuknyVerifiedStatus | null>(null);
  const [identityStatus, setIdentityStatus] = useState<IdentityVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [verifiedResult, identityResult] = await Promise.allSettled([
        fetchRuknyVerifiedStatus(),
        fetchIdentityStatus(),
      ]);

      if (identityResult.status === "fulfilled") {
        setIdentityStatus(identityResult.value);
      }

      if (verifiedResult.status === "fulfilled") {
        setVerifiedStatus(verifiedResult.value);
      } else {
        const err = verifiedResult.reason as Error & { status?: number };
        console.error("[verified] status fetch failed:", err?.status, err?.message);
        setVerifiedStatus({ status: "none", canApply: false });
        setError(
          err?.status === 404
            ? t("verified.load_error_not_found")
            : err?.status === 500
              ? t("verified.load_error_backend")
              : t("verified.load_error"),
        );
      }

      if (identityResult.status === "rejected" && verifiedResult.status === "fulfilled") {
        setError(t("verified.load_error_identity"));
      }
    } catch {
      setError(t("verified.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName =
    profile?.profile?.name || user.name || t("default_name");

  const checklist = useMemo(() => {
    const eligibility = verifiedStatus?.eligibility;
    const hasPhone = eligibility?.phone ?? Boolean(profile?.phone?.trim());
    const hasProfile =
      eligibility?.profile ??
      (Boolean(profile?.profile?.name?.trim()) &&
        Boolean(profile?.profile?.username?.trim()) &&
        Boolean(profile?.profile?.avatar));
    const hasEmail =
      eligibility?.email ?? Boolean(profile?.emailVerified ?? summary?.emailVerified);
    const has2FA =
      eligibility?.twoFactor ??
      Boolean(profile?.twoFactorEnabled ?? summary?.twoFactorEnabled);
    const hasIdentity =
      eligibility?.identity ?? (identityStatus?.verificationLevel ?? 0) >= 3;
    const identityPending =
      !hasIdentity &&
      (identityStatus?.currentRequest?.status === "pending" ||
        identityStatus?.currentRequest?.status === "underReview");

    const items = [
      {
        id: "email",
        done: hasEmail,
        label: t("verified.checklist.email"),
        hint: t("verified.checklist.email_hint"),
        href: "/manage/personal-info",
      },
      {
        id: "phone",
        done: hasPhone,
        label: t("verified.checklist.phone"),
        hint: t("verified.checklist.phone_hint"),
        href: "/manage/personal-info",
      },
      {
        id: "profile",
        done: hasProfile,
        label: t("verified.checklist.profile"),
        hint: t("verified.checklist.profile_hint"),
        href: "/manage/personal-info",
      },
      {
        id: "2fa",
        done: has2FA,
        label: t("verified.checklist.two_factor"),
        hint: t("verified.checklist.two_factor_hint"),
        href: "/manage/security/two-factor",
      },
        {
          id: "identity",
          done: hasIdentity,
          pendingReview: identityPending,
          label: t("verified.checklist.identity"),
          hint: t("verified.checklist.identity_hint"),
          pendingHint: t("verified.checklist.identity_pending_hint"),
          href: identityStatus?.canUpload ? "#identity-upload" : undefined,
        },
    ];

    const allRequiredDone = items.every((item) => item.done);

    return { items, allRequiredDone };
  }, [profile, summary, identityStatus, verifiedStatus?.eligibility, t]);

  const faqKeys = ["difference", "cost", "duration", "revoke"] as const;

  if (loading) {
    return <ManageSpinner />;
  }

  const status = verifiedStatus?.status ?? "none";
  const canApply = Boolean(verifiedStatus?.canApply);
  const showApplyForm =
    (status === "none" || status === "rejected") && canApply;
  const showStep2Locked =
    (status === "none" || status === "rejected") && !canApply;
  const showIdentityUpload = Boolean(identityStatus?.canUpload);
  const identityRejected =
    identityStatus?.currentRequest?.status === "rejected";
  const heroName =
    status === "verified" && verifiedStatus?.verifiedDisplayName
      ? verifiedStatus.verifiedDisplayName
      : displayName;

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("verified.title")}
        titleShort={t("nav.verified_short")}
        description={t("verified.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ManageGroup className="p-4">
        <div className="min-w-0">
          <p className="text-base font-medium text-foreground">
            <VerifiedDisplayName
              name={heroName}
              verified={status === "verified"}
              badgeSize={18}
            />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(`verified.status.${status}`)}
          </p>
            {status === "rejected" && verifiedStatus?.rejectionReason && (
              <p className="mt-2 text-sm text-destructive">
                {verifiedStatus.rejectionReason}
              </p>
            )}
            {status === "verified" && verifiedStatus?.verifiedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("verified.since")}{" "}
                {new Date(verifiedStatus.verifiedAt).toLocaleDateString(
                  locale === "ar" ? "ar-IQ" : undefined,
                )}
                {verifiedStatus.verifiedCategory && (
                  <>
                    {" · "}
                    {t(`verified.apply_form.category_${verifiedStatus.verifiedCategory as "personal" | "business" | "creator"}`)}
                  </>
                )}
              </p>
            )}
            {status === "pending" && verifiedStatus?.application && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("verified.pending_note")}
              </p>
            )}
        </div>
      </ManageGroup>

      <VerifiedSection
        title={t("verified.benefits.title")}
        description={t("verified.benefits.description")}
      >
        <ManageGroup>
          {(["trust", "badge", "priority", "protection"] as const).map((key) => (
            <div key={key} className={cn("flex gap-3 px-4 py-3.5", ui.divider)}>
              <ManageIconCircle icon={BadgeCheck} tone="blue" muted />
              <div>
                <p className="text-sm font-medium">{t(`verified.benefits.${key}_title`)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`verified.benefits.${key}_desc`)}
                </p>
              </div>
            </div>
          ))}
        </ManageGroup>
      </VerifiedSection>

      <VerifiedSection
        title={t("verified.step1.title")}
        description={t("verified.step1.description")}
      >
        <ManageGroup>
          {checklist.items.map((item) => (
            <ChecklistRow
              key={item.id}
              done={item.done}
              pendingReview={"pendingReview" in item ? item.pendingReview : false}
              label={item.label}
              hint={item.hint}
              pendingHint={"pendingHint" in item ? item.pendingHint : undefined}
              pendingLabel={t("verified.checklist.pending_badge")}
              href={"href" in item ? item.href : undefined}
              isRtl={isRtl}
            />
          ))}
        </ManageGroup>
        {showStep2Locked && (
          <p className="mt-3 px-0.5 text-xs text-muted-foreground">
            {checklist.allRequiredDone
              ? t("verified.step2.awaiting_admin")
              : t("verified.apply_blocked_hint")}
          </p>
        )}
      </VerifiedSection>

      {showIdentityUpload && (
        <VerifiedSection
          title={t("identity_upload.section_title")}
          description={t("identity_upload.section_description")}
        >
          {identityRejected && identityStatus?.currentRequest?.rejectionReason && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>
                {identityStatus.currentRequest.rejectionReason}
              </AlertDescription>
            </Alert>
          )}
          <IdentityUploadForm
            twoFactorEnabled={Boolean(
              identityStatus?.twoFactorEnabled ??
                profile?.twoFactorEnabled ??
                summary?.twoFactorEnabled,
            )}
            onSuccess={load}
          />
        </VerifiedSection>
      )}

      {showApplyForm && (
        <VerifiedSection
          title={
            status === "rejected"
              ? t("verified.apply_again")
              : t("verified.step2.title")
          }
          description={t("verified.step2.description")}
        >
          <VerifiedApplyForm
            defaultDisplayName={displayName}
            onSuccess={load}
          />
        </VerifiedSection>
      )}

      {showStep2Locked && (
        <VerifiedSection
          title={t("verified.step2.title")}
          description={t("verified.step2.locked_description")}
        >
          <ManageGroup className="p-4 px-4 py-5">
            <p className="text-sm text-muted-foreground">{t("verified.step2.locked_hint")}</p>
          </ManageGroup>
        </VerifiedSection>
      )}

      <VerifiedSection title={t("verified.faq.title")}>
        <ManageGroup>
          {faqKeys.map((key) => (
            <div key={key} className={cn("px-4 py-4", ui.divider)}>
              <p className="text-sm font-medium">{t(`verified.faq.${key}_q`)}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t(`verified.faq.${key}_a`)}
              </p>
            </div>
          ))}
        </ManageGroup>
      </VerifiedSection>
    </ManagePageStack>
  );
}
