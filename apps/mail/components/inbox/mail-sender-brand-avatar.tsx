"use client";

import { BadgeCheck } from "lucide-react";
import { cn } from "@heroui/react";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import type {
  MailMessageAuthentication,
  MailMessageVerificationType,
  MailSenderBrandStatusApi,
} from "@/lib/mail-messages-client";
import { mailFeatureFlags } from "@/lib/mail-feature-flags";

type Props = {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  brandLogoUrl?: string | null;
  brandStatus?: MailSenderBrandStatusApi | null;
  authentication?: MailMessageAuthentication | null;
  verificationType?: MailMessageVerificationType | null;
  className?: string;
  textClassName?: string;
};

const VERIFICATION_LABELS: Record<MailMessageVerificationType, string> = {
  BIMI_VMC: "BIMI Verified",
  RUKNY: "Verified by Rukny",
};

export function MailSenderBrandAvatar({
  name,
  email,
  avatarUrl,
  brandLogoUrl,
  brandStatus,
  authentication,
  verificationType,
  className,
  textClassName,
}: Props) {
  const dmarcPassed = authentication?.dmarc === "PASS";
  const usableBrandLogo =
    mailFeatureFlags.showBimiLogos && dmarcPassed && brandStatus === "READY"
      ? brandLogoUrl
      : null;
  const verified =
    dmarcPassed &&
    (verificationType !== "RUKNY" || mailFeatureFlags.ruknyVerification)
      ? verificationType
      : null;
  const verificationLabel = verified ? VERIFICATION_LABELS[verified] : null;

  return (
    <span className="relative inline-flex shrink-0">
      <MailPersonAvatar
        name={name}
        email={email}
        avatarUrl={usableBrandLogo || avatarUrl}
        className={className}
        textClassName={textClassName}
      />
      {verificationLabel ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 flex size-[15px] items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-[0_0_0_1.5px_white] dark:bg-[var(--surface)] dark:shadow-[0_0_0_1.5px_var(--surface)]",
            className?.includes("size-7") && "size-3.5",
          )}
          aria-label={verificationLabel}
          title={verificationLabel}
        >
          <BadgeCheck className="size-full fill-[var(--primary)] text-white dark:text-[var(--surface)]" />
        </span>
      ) : null}
    </span>
  );
}
