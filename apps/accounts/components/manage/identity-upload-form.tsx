"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Upload, Shield, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createIdentityUploadSession,
  uploadIdentityFile,
  submitIdentityVerification,
} from "@/lib/manage/api";
import type {
  IdentityDocumentSlot,
  IdentityDocumentType,
  IdentityUploadSession,
} from "@/lib/manage/types";
import { cn } from "@/lib/utils";
import { status } from "@/lib/status-colors";
import { ManageGroup, ManageSuccessBanner, ui } from "./manage-ui";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function requiredSlots(documentType: IdentityDocumentType): IdentityDocumentSlot[] {
  const base: IdentityDocumentSlot[] = [
    "primary_front",
    "residence_front",
    "residence_back",
  ];
  if (documentType === "passport") return base;
  return [...base, "primary_back"];
}

interface SlotUploadProps {
  slot: IdentityDocumentSlot;
  label: string;
  hint?: string;
  uploaded: boolean;
  uploading: boolean;
  disabled: boolean;
  onSelect: (file: File) => void;
}

function SlotUpload({
  slot,
  label,
  hint,
  uploaded,
  uploading,
  disabled,
  onSelect,
}: SlotUploadProps) {
  const inputId = `identity-${slot}`;

  return (
    <div className={cn("px-4 py-4", ui.divider)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={inputId} className="text-sm font-medium">
            {label}
          </label>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {uploaded && (
          <CheckCircle2 className={cn("size-5 shrink-0", status.successIcon)} strokeWidth={1.75} />
        )}
      </div>
      <div className="mt-3">
        <input
          id={inputId}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          disabled={disabled || uploading || uploaded}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            e.target.value = "";
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
            disabled || uploaded
              ? "pointer-events-none border-border/60 text-muted-foreground"
              : "border-border hover:bg-muted/50",
          )}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" strokeWidth={1.75} />
          )}
          {uploaded ? "✓" : label}
        </label>
      </div>
    </div>
  );
}

interface IdentityUploadFormProps {
  twoFactorEnabled: boolean;
  onSuccess: () => void;
}

export function IdentityUploadForm({
  twoFactorEnabled,
  onSuccess,
}: IdentityUploadFormProps) {
  const t = useTranslations("Manage.identity_upload");

  const [documentType, setDocumentType] =
    useState<IdentityDocumentType>("national_id");
  const [session, setSession] = useState<IdentityUploadSession | null>(null);
  const [uploadedSlots, setUploadedSlots] = useState<Set<IdentityDocumentSlot>>(
    new Set(),
  );
  const [uploadingSlot, setUploadingSlot] = useState<IdentityDocumentSlot | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const slots = useMemo(() => requiredSlots(documentType), [documentType]);

  const initSession = useCallback(async () => {
    if (!twoFactorEnabled) {
      setSessionLoading(false);
      return;
    }
    setSessionLoading(true);
    setError(null);
    try {
      const s = await createIdentityUploadSession();
      setSession(s);
      setUploadedSlots(new Set());
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("session_error"),
      );
    } finally {
      setSessionLoading(false);
    }
  }, [twoFactorEnabled, t]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const handleFile = async (slot: IdentityDocumentSlot, file: File) => {
    if (!session) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("invalid_type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("invalid_size"));
      return;
    }

    setUploadingSlot(slot);
    try {
      await uploadIdentityFile({
        sessionId: session.sessionId,
        slot,
        file,
      });
      setUploadedSlots((prev) => new Set(prev).add(slot));
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("upload_error"),
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const missing = slots.filter((s) => !uploadedSlots.has(s));
    if (missing.length > 0) {
      setError(t("missing_files"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await submitIdentityVerification({
        sessionId: session.sessionId,
        documentType,
      });
      setSuccess(true);
      onSuccess();
      if (result.message) {
        // message shown via success banner
      }
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("submit_error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!twoFactorEnabled) {
    return (
      <ManageGroup className="px-4 py-5">
        <div className="flex gap-3">
          <Shield className={cn("size-5 shrink-0", status.warning)} strokeWidth={1.75} />
          <div>
            <p className="text-sm font-medium">{t("two_factor_required_title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("two_factor_required_desc")}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
              <Link href="/manage/security/two-factor">{t("enable_2fa")}</Link>
            </Button>
          </div>
        </div>
      </ManageGroup>
    );
  }

  if (sessionLoading) {
    return (
      <ManageGroup className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("preparing")}
      </ManageGroup>
    );
  }

  const slotLabels: Record<IdentityDocumentSlot, string> = {
    primary_front: t("slots.primary_front"),
    primary_back: t("slots.primary_back"),
    residence_front: t("slots.residence_front"),
    residence_back: t("slots.residence_back"),
  };

  const slotHints: Partial<Record<IdentityDocumentSlot, string>> = {
    primary_front: t("slots.primary_front_hint"),
    primary_back: t("slots.primary_back_hint"),
    residence_front: t("slots.residence_hint"),
    residence_back: t("slots.residence_hint"),
  };

  return (
    <form onSubmit={handleSubmit} id="identity-upload">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && <ManageSuccessBanner>{t("submit_success")}</ManageSuccessBanner>}

      <ManageGroup className="mb-4 divide-y divide-border/60">
        <div className={cn("space-y-3 px-4 py-4", ui.divider)}>
          <p className="text-sm font-medium">{t("privacy_title")}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("privacy_desc")}
          </p>
        </div>
      </ManageGroup>

      <ManageGroup className="divide-y divide-border/60">
        <div className={cn("space-y-3 px-4 py-4", ui.divider)}>
          <p className="text-sm font-medium">{t("document_type_label")}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["national_id", t("types.national_id")],
                ["passport", t("types.passport")],
                ["driving_license", t("types.driving_license")],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={submitting || success}
                onClick={() => {
                  setDocumentType(value);
                  setUploadedSlots(new Set());
                  initSession();
                }}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  documentType === value ? ui.chipSelected : ui.chipIdle,
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {slots.map((slot) => (
          <SlotUpload
            key={slot}
            slot={slot}
            label={slotLabels[slot]}
            hint={slotHints[slot]}
            uploaded={uploadedSlots.has(slot)}
            uploading={uploadingSlot === slot}
            disabled={submitting || success || !session}
            onSelect={(file) => handleFile(slot, file)}
          />
        ))}
      </ManageGroup>

      <Button
        type="submit"
        disabled={submitting || success || !session}
        className="mt-4 w-fit rounded-full"
      >
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
