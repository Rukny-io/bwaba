"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, User, Mail, AtSign, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useManage } from "@/lib/manage/context";
import { updateProfile } from "@/lib/manage/api";
import { AvatarUpload } from "./avatar-upload";
import { DangerZonePanel } from "./danger-zone-panel";
import {
  ManageGroup,
  ManageInfoRow,
  ManagePageHeader,
  ManagePageStack,
  ManageSpinner,
  ManageSuccessBanner,
} from "./manage-ui";
import { VerifiedBadge } from "./verified-badge";

export function PersonalInfoForm() {
  const t = useTranslations("Manage");
  const { profile, user, refreshProfile, refreshSummary } = useManage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState<"name" | "phone" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isVerified = Boolean(profile?.isRuknyVerified);
  const displayName =
    (isVerified && profile?.verifiedDisplayName) ||
    profile?.profile?.name ||
    user.name ||
    t("default_name");
  const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (profile) {
      setName(profile.profile?.name || "");
      setPhone(profile.phone || "");
      setAvatar(profile.profile?.avatar || "");
    }
  }, [profile]);

  const save = async (fields: { name?: string; phone?: string; avatar?: string }) => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfile(fields);
      await Promise.all([refreshProfile(), refreshSummary()]);
      setSuccess(true);
      setEditing(null);
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("personal_info.save_error"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <ManageSpinner />;
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("personal_info.title")}
        description={t("personal_info.description")}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <ManageSuccessBanner>{t("personal_info.save_success")}</ManageSuccessBanner>
      )}

      <ManageGroup>
        <ManageInfoRow icon={Camera} label={t("personal_info.avatar_label")}>
          <div className="mt-2">
            <AvatarUpload
              currentUrl={avatar}
              fallbackInitial={initials}
              className="items-start"
              onUploaded={async (key) => {
                setAvatar(key);
                await save({ avatar: key });
              }}
            />
          </div>
        </ManageInfoRow>

        {isVerified && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-blue-700">
            <VerifiedBadge size={16} />
            <span>{t("verified.badge_label")}</span>
          </div>
        )}

        <ManageInfoRow
          icon={User}
          label={t("personal_info.full_name")}
          value={editing !== "name" ? displayName || "—" : undefined}
        >
          {editing === "name" ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background"
                autoFocus
              />
              <Button
                size="sm"
                disabled={saving}
                onClick={() => save({ name: name.trim() || undefined })}
              >
                {saving ? t("personal_info.saving") : t("personal_info.save")}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing("name")}
              className="mt-1 text-xs text-primary hover:underline"
            >
              {t("personal_info.edit")}
            </button>
          )}
        </ManageInfoRow>

        <ManageInfoRow
          icon={Mail}
          label={t("personal_info.email")}
          value={
            <span dir="ltr" className="inline-flex items-center gap-2">
              {profile.email}
              {profile.emailVerified && (
                <span className="text-xs text-muted-foreground">
                  · {t("badges.verified")}
                </span>
              )}
            </span>
          }
        />

        {profile.profile?.username && (
          <ManageInfoRow
            icon={AtSign}
            label={t("personal_info.username")}
            value={<span dir="ltr">@{profile.profile.username}</span>}
          />
        )}

        <ManageInfoRow
          icon={Phone}
          label={t("personal_info.phone")}
          value={editing !== "phone" ? phone || "—" : undefined}
        >
          {editing === "phone" ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                placeholder="+964..."
                className="bg-background"
                autoFocus
              />
              <Button
                size="sm"
                disabled={saving}
                onClick={() => save({ phone: phone.trim() || undefined })}
              >
                {saving ? t("personal_info.saving") : t("personal_info.save")}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing("phone")}
              className="mt-1 text-xs text-primary hover:underline"
            >
              {t("personal_info.edit")}
            </button>
          )}
        </ManageInfoRow>
      </ManageGroup>

      <DangerZonePanel />
    </ManagePageStack>
  );
}
