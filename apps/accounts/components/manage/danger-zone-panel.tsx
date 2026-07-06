"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { deleteAccount } from "@/lib/manage/api";
import { ManageGroup, ManageSection } from "./manage-ui";

export function DangerZonePanel() {
  const t = useTranslations("Manage");
  const router = useRouter();

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError(t("danger.delete_confirm_error"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteAccount({
        confirmation: deleteConfirmation,
        reason: deleteReason.trim() || undefined,
      });
      router.push("/login?session=logout");
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("danger.delete_error"),
      );
      setBusy(false);
    }
  };

  return (
    <ManageSection title={t("danger.title")} variant="danger">
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ManageGroup className="space-y-4 border-destructive/20 p-4">
        <div>
          <h3 className="text-sm font-medium text-destructive">
            {t("danger.delete_title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("danger.delete_desc")}</p>
        </div>

        {!showDeleteConfirm ? (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            {t("danger.delete_start")}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="delete-confirm">{t("danger.delete_type")}</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                dir="ltr"
                className="mt-1.5 bg-background font-mono"
              />
            </div>
            <div>
              <Label htmlFor="delete-reason">{t("danger.reason_optional")}</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-1.5 min-h-[72px] bg-background"
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={busy || deleteConfirmation !== "DELETE"}
              >
                {busy ? t("danger.deleting") : t("danger.delete_confirm")}
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </ManageGroup>
    </ManageSection>
  );
}
