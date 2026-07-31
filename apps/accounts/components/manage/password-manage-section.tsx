"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  changePassword,
  fetchPasswordStatus,
  removePassword,
  setPassword,
  type PasswordStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ManageGroup,
  ManageSpinner,
  ui,
} from "./manage-ui";

type Mode = "idle" | "set" | "change" | "remove";

export function PasswordManageSection() {
  const t = useTranslations("Manage.password");
  const [status, setStatus] = useState<PasswordStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("idle");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPasswordStatus();
      setStatus(data);
    } catch {
      setError(t("load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setMode("idle");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "set" || mode === "change") {
      if (newPassword.length < 10 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
        setError(t("policy_error"));
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t("mismatch"));
        return;
      }
    }

    setSaving(true);
    try {
      if (mode === "set") {
        await setPassword(newPassword);
        setSuccess(t("set_success"));
      } else if (mode === "change") {
        await changePassword(currentPassword, newPassword);
        setSuccess(t("change_success"));
      } else if (mode === "remove") {
        await removePassword(currentPassword);
        setSuccess(t("remove_success"));
      }
      resetForm();
      await load();
    } catch (err) {
      const message =
        (err as Error & { data?: { message?: string } }).data?.message ||
        (err as Error).message ||
        t("save_error");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ManageSpinner />;
  }

  const fieldClass =
    "flex h-11 items-center gap-2 overflow-hidden rounded-xl border border-input/70 bg-background px-3";

  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <p className="text-sm font-medium text-foreground">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("description")}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <ManageGroup>
        <div className={cn("flex items-center gap-3 px-4 py-3.5", ui.divider)}>
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {status?.hasPassword ? t("enabled") : t("not_set")}
            </p>
            <p className="text-xs text-muted-foreground">
              {status?.hasPassword ? t("enabled_hint") : t("not_set_hint")}
            </p>
          </div>
          {mode === "idle" ? (
            <div className="flex shrink-0 gap-2">
              {status?.hasPassword ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSuccess(null);
                      setMode("change");
                    }}
                  >
                    {t("change")}
                  </Button>
                  {status.canRemove ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSuccess(null);
                        setMode("remove");
                      }}
                    >
                      {t("remove")}
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSuccess(null);
                    setMode("set");
                  }}
                >
                  {t("set")}
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {mode !== "idle" ? (
          <form onSubmit={handleSubmit} className="space-y-3 px-4 py-4">
            {(mode === "change" || mode === "remove") && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {t("current_label")}
                </label>
                <div className={fieldClass}>
                  <input
                    type={show ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                    autoComplete="current-password"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {(mode === "set" || mode === "change") && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t("new_label")}
                  </label>
                  <div className={fieldClass}>
                    <input
                      type={show ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                      autoComplete="new-password"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((v) => !v)}
                      className="text-muted-foreground"
                      aria-label={show ? t("hide") : t("show")}
                    >
                      {show ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("policy_hint")}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t("confirm_label")}
                  </label>
                  <div className={fieldClass}>
                    <input
                      type={show ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                      autoComplete="new-password"
                      dir="ltr"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === "remove" ? (
              <p className="text-xs text-muted-foreground">{t("remove_hint")}</p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : mode === "remove" ? (
                  t("confirm_remove")
                ) : (
                  t("save")
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={resetForm}
                disabled={saving}
              >
                {t("cancel")}
              </Button>
            </div>
          </form>
        ) : null}
      </ManageGroup>
    </div>
  );
}
