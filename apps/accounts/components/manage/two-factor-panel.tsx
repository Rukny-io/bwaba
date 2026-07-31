"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ShieldCheck, ShieldOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  disable2FA,
  enable2FA,
  fetch2FAStatus,
  regenerateBackupCodes,
  setup2FA,
} from "@/lib/manage/api";
import { clearSetup2FACache } from "@/lib/api";
import { useManage } from "@/lib/manage/context";
import { OtpCodeInput } from "./otp-code-input";
import {
  ManageGroup,
  ManageIconCircle,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ManageSuccessBanner,
  ui,
} from "./manage-ui";
import { cn } from "@/lib/utils";

type SetupState = "idle" | "scanning" | "backup";
type RegenState = "idle" | "confirm" | "done";

function resolveBackupCodes(
  fromEnable: string[],
  fromSetup: string[],
): string[] {
  const usable = fromEnable.filter((code) => code && !code.includes("*"));
  if (usable.length > 0) return usable;
  return fromSetup;
}

export function TwoFactorPanel() {
  const t = useTranslations("Manage");
  const tAuth = useTranslations("Auth");
  const { refreshProfile, refreshSummary } = useManage();

  const [enabled, setEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setupState, setSetupState] = useState<SetupState>("idle");
  const [regenState, setRegenState] = useState<RegenState>("idle");
  const [regenToken, setRegenToken] = useState("");
  const [regenCodes, setRegenCodes] = useState<string[]>([]);
  const [qrData, setQrData] = useState<{ qrCodeUrl: string; secret: string } | null>(null);
  const [token, setToken] = useState("");
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([]);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableToken, setDisableToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetch2FAStatus();
      setEnabled(status.enabled);
      setBackupCodesRemaining(status.backupCodesRemaining ?? 0);
    } catch {
      setError(t("two_factor.load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const resetSetup = () => {
    setSetupState("idle");
    setQrData(null);
    setToken("");
    setPendingBackupCodes([]);
    setError(null);
  };

  const handleStartSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      clearSetup2FACache();
      const data = await setup2FA();
      setQrData({ qrCodeUrl: data.qrCodeUrl, secret: data.secret });
      setPendingBackupCodes(data.backupCodes ?? []);
      setSetupState("scanning");
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        t("two_factor.setup_error");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleEnable = async () => {
    if (token.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      const result = await enable2FA(token.trim());
      const codes = resolveBackupCodes(result.backupCodes, pendingBackupCodes);
      setBackupCodes(codes);
      setSetupState("backup");
      setEnabled(true);
      setToken("");
      await Promise.all([refreshProfile(), refreshSummary()]);
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        (err as Error).message ||
        tAuth("authenticator_invalid");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (disableToken.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await disable2FA(disableToken.trim());
      setEnabled(false);
      resetSetup();
      setDisableToken("");
      setBackupCodes([]);
      await Promise.all([refreshProfile(), refreshSummary()]);
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        (err as Error).message ||
        tAuth("authenticator_invalid");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const copyBackupCodes = async () => {
    const codes = regenState === "done" ? regenCodes : backupCodes;
    if (codes.length === 0) return;
    await navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (regenToken.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      const result = await regenerateBackupCodes(regenToken.trim());
      setRegenCodes(result.backupCodes);
      setRegenState("done");
      setRegenToken("");
      setBackupCodesRemaining(result.backupCodes.length);
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        (err as Error).message ||
        tAuth("authenticator_invalid");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const resetRegen = () => {
    setRegenState("idle");
    setRegenToken("");
    setRegenCodes([]);
    setError(null);
  };

  if (loading) {
    return <ManageSpinner />;
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("two_factor.title")}
        titleShort={t("security.two_factor_short")}
        description={t("two_factor.description")}
      />

      <ManageGroup className="flex items-center gap-3 p-4">
        <ManageIconCircle icon={enabled ? ShieldCheck : ShieldOff} tone="blue" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">
              {enabled ? t("two_factor.status_on") : t("two_factor.status_off")}
            </p>
            <Badge variant={enabled ? "secondary" : "outline"}>
              {enabled ? t("badges.enabled") : t("badges.disabled")}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {enabled ? t("two_factor.status_on_desc") : t("two_factor.status_off_desc")}
          </p>
        </div>
      </ManageGroup>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!enabled && setupState === "idle" && (
        <Button onClick={handleStartSetup} disabled={busy} className="w-fit">
          {busy ? t("two_factor.setting_up") : t("two_factor.enable")}
        </Button>
      )}

      {!enabled && setupState === "scanning" && qrData && (
        <ManageGroup className="space-y-5 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{tAuth("setup_2fa_scan")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("two_factor.scan_hint")}</p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {t("two_factor.rescan_hint")}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="rounded-2xl border border-border bg-card p-3">
              <img
                src={qrData.qrCodeUrl}
                alt="2FA QR"
                className="size-44"
              />
            </div>
          </div>

          <div className={cn("rounded-xl border border-border bg-muted/30 px-3 py-2.5", ui.divider)}>
            <p className="text-xs text-muted-foreground">{tAuth("setup_2fa_manual")}</p>
            <p
              className="mt-1 break-all text-sm font-medium tracking-wide select-all"
              dir="ltr"
            >
              {qrData.secret}
            </p>
          </div>

          <div className="min-w-0 space-y-3">
            <p className="text-sm font-medium text-foreground">
              {tAuth("setup_2fa_code_label")}
            </p>
            <OtpCodeInput
              value={token}
              onChange={setToken}
              disabled={busy}
              aria-label={tAuth("setup_2fa_code_label")}
              aria-invalid={!!error}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEnable}
              disabled={busy || token.length !== 6}
            >
              {busy ? tAuth("activating_2fa") : tAuth("activate_2fa")}
            </Button>
            <Button variant="ghost" onClick={resetSetup}>
              {t("cancel")}
            </Button>
          </div>
        </ManageGroup>
      )}

      {setupState === "backup" && backupCodes.length > 0 && (
        <ManageGroup className="space-y-4 p-4">
          <ManageSuccessBanner>{tAuth("2fa_success")}</ManageSuccessBanner>
          <div>
            <p className="text-sm font-medium text-foreground">
              {tAuth("backup_codes_title")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tAuth("backup_codes_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {backupCodes.map((code) => (
              <div
                key={code}
                className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-center text-sm font-semibold tracking-wider select-all"
                dir="ltr"
              >
                {code}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyBackupCodes}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t("two_factor.copied") : tAuth("copy_codes")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSetupState("idle");
                setBackupCodes([]);
                setPendingBackupCodes([]);
              }}
            >
              {t("two_factor.done")}
            </Button>
          </div>
        </ManageGroup>
      )}

      {enabled && setupState !== "backup" && (
        <ManageGroup className="space-y-4 p-4">
          <div className="min-w-0">
            <p className="text-pretty text-sm text-muted-foreground">
              {t("two_factor.disable_desc")}
            </p>
          </div>
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-medium text-foreground">
              {tAuth("setup_2fa_code_label")}
            </p>
            <OtpCodeInput
              value={disableToken}
              onChange={setDisableToken}
              disabled={busy}
              aria-label={tAuth("setup_2fa_code_label")}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={busy || disableToken.length !== 6}
            className="w-fit"
          >
            {busy ? t("two_factor.disabling") : t("two_factor.disable")}
          </Button>
        </ManageGroup>
      )}

      {enabled && setupState !== "backup" && (
        <ManageGroup className="space-y-4 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("two_factor.backup_codes_title")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("two_factor.backup_codes_remaining", {
                count: backupCodesRemaining,
              })}
            </p>
          </div>

          {regenState === "idle" && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setRegenState("confirm")}
            >
              <RefreshCw className="size-4" />
              {t("two_factor.regenerate")}
            </Button>
          )}

          {regenState === "confirm" && (
            <div className="min-w-0 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-pretty text-xs text-muted-foreground">
                {t("two_factor.regenerate_desc")}
              </p>
              <OtpCodeInput
                value={regenToken}
                onChange={setRegenToken}
                disabled={busy}
                aria-label={tAuth("setup_2fa_code_label")}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={busy || regenToken.length !== 6}
                >
                  {busy ? t("two_factor.regenerating") : t("two_factor.regenerate_confirm")}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetRegen} disabled={busy}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          )}
        </ManageGroup>
      )}

      {regenState === "done" && regenCodes.length > 0 && (
        <ManageGroup className="space-y-4 p-4">
          <ManageSuccessBanner>{t("two_factor.regenerate_success")}</ManageSuccessBanner>
          <p className="text-sm text-muted-foreground">{tAuth("backup_codes_desc")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {regenCodes.map((code) => (
              <div
                key={code}
                className="rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-center text-sm font-semibold tracking-wider select-all"
                dir="ltr"
              >
                {code}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyBackupCodes}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t("two_factor.copied") : tAuth("copy_codes")}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetRegen}>
              {t("two_factor.done")}
            </Button>
          </div>
        </ManageGroup>
      )}
    </ManagePageStack>
  );
}
