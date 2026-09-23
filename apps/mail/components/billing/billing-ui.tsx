"use client";

import type { ReactNode } from "react";
import { CloseButton, cn } from "@heroui/react";

export function BillingSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] px-4 py-5 md:px-6 md:py-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function BillingPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BillingDetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="shrink-0 text-[13px] text-[var(--muted-foreground)]">
        {label}
      </span>
      <span
        className={cn(
          "min-w-0 text-end text-[13px] leading-snug text-[var(--foreground)]",
          strong && "font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type BillingNoticeTone = "success" | "danger" | "warning" | "info";

export function BillingNotice({
  tone = "info",
  title,
  description,
  onDismiss,
}: {
  tone?: BillingNoticeTone;
  title: string;
  description?: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-2xl px-4 py-3",
        tone === "success" &&
          "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-secondary))]",
        tone === "danger" &&
          "bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-secondary))]",
        tone === "warning" &&
          "bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface-secondary))]",
        tone === "info" && "bg-[var(--surface-secondary)]",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[13px] leading-5 text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {onDismiss ? (
        <CloseButton
          aria-label="Dismiss"
          className="shrink-0"
          onPress={onDismiss}
        />
      ) : null}
    </div>
  );
}

export function formatInvoiceDeliveryMessage(input: {
  invoiceNumber?: string;
  emailStatus?: string;
  whatsappStatus?: string;
  downloaded?: boolean;
}): { title: string; description: string } {
  const number = input.invoiceNumber?.trim() || "Invoice";

  if (input.downloaded) {
    return {
      title: "Invoice downloaded",
      description: `${number} saved to your device.`,
    };
  }

  const emailOk = ["sent", "delivered", "success"].includes(
    (input.emailStatus || "").toLowerCase(),
  );
  const whatsappOk = ["sent", "delivered", "success"].includes(
    (input.whatsappStatus || "").toLowerCase(),
  );
  const whatsappSkipped = ["no_recipient", "skipped", "unavailable"].includes(
    (input.whatsappStatus || "").toLowerCase(),
  );

  if (emailOk && whatsappOk) {
    return {
      title: "Invoice delivered",
      description: `${number} was sent to your billing email and WhatsApp.`,
    };
  }

  if (emailOk && whatsappSkipped) {
    return {
      title: "Invoice sent",
      description: `${number} was emailed to your billing contact. WhatsApp was skipped — no phone on file.`,
    };
  }

  if (emailOk) {
    return {
      title: "Invoice sent",
      description: `${number} was emailed to your billing contact.`,
    };
  }

  if (whatsappOk) {
    return {
      title: "Invoice sent",
      description: `${number} was delivered via WhatsApp.`,
    };
  }

  return {
    title: "Invoice issued",
    description: `${number} is ready. Delivery status: email ${input.emailStatus || "pending"}, WhatsApp ${input.whatsappStatus || "pending"}.`,
  };
}
