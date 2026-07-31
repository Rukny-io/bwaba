"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AtSign,
  Check,
  Eye,
  FileText,
  Loader2,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useManage } from "@/lib/manage/context";
import { updateProfile, updateProfileDetails, sendPhoneVerificationOtp, verifyPhoneOtp } from "@/lib/manage/api";
import type { ProfileTaskId } from "@/lib/manage/types";
import { getPublicProfileUrl } from "@/lib/manage/public-profile-url";
import { useUsernameCheck } from "@/hooks/use-username-check";
import { DangerZonePanel } from "./danger-zone-panel";
import { ProfilePublicSection } from "./profile-public-section";
import { ProfileTopSection } from "./profile-top-section";
import {
  ManageGroup,
  ManageIconCircle,
  ManageInfoRow,
  ManagePageHeader,
  ManagePageStack,
  ManageProfileTaskSlider,
  ManageSpinner,
  ManageSuccessBanner,
  ui,
} from "./manage-ui";
import { VerifiedBadge } from "./verified-badge";
import { OtpCodeInput } from "./otp-code-input";
import { isValidUsername } from "@/lib/validation/username";
import { cn } from "@/lib/utils";

type EditingField = "name" | "username" | "bio" | "phone" | null;
type PhoneEditStep = "input" | "verify";

function normalizePhoneInput(phone: string): string {
  return phone.trim().replace(/[\s\-()]/g, "");
}

function extractApiErrorMessage(err: unknown): string | undefined {
  const data = (err as Error & { data?: { message?: string | string[] } }).data;
  if (!data?.message) return undefined;
  return Array.isArray(data.message) ? data.message[0] : data.message;
}

function extractApiTicketNumber(err: unknown): string | undefined {
  const data = (err as Error & { data?: { ticketNumber?: string } }).data;
  return data?.ticketNumber;
}

function isValidPhoneInput(phone: string): boolean {
  const normalized = normalizePhoneInput(phone);
  if (!normalized) return false;
  const digits = normalized.replace(/\D/g, "");
  return digits.length >= 10;
}

export function PersonalInfoForm() {
  const t = useTranslations("Manage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, user, refreshProfile, refreshSummary } = useManage();
  const heroRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Partial<Record<NonNullable<EditingField>, HTMLDivElement | null>>>({});

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [editing, setEditing] = useState<EditingField>(null);
  const [saving, setSaving] = useState(false);
  const [savingPhoneVisibility, setSavingPhoneVisibility] = useState(false);
  const [hidePhone, setHidePhone] = useState(true);
  const [phoneStep, setPhoneStep] = useState<PhoneEditStep>("input");
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [phoneSupportTicket, setPhoneSupportTicket] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    usernameAvailable,
    isCheckingUsername,
    scheduleUsernameCheck,
    resetUsernameCheck,
  } = useUsernameCheck();

  const isVerified = Boolean(profile?.isRuknyVerified);
  const displayName =
    (isVerified && profile?.verifiedDisplayName) ||
    profile?.profile?.name ||
    user.name ||
    t("default_name");
  const initials = displayName.charAt(0).toUpperCase();
  const currentUsername = profile?.profile?.username || "";
  const publicProfileUrl = getPublicProfileUrl(profile?.profile?.username);
  const savedPhone = (profile?.phone || "").trim();
  const hasSavedPhone = Boolean(savedPhone);

  useEffect(() => {
    if (profile) {
      setName(profile.profile?.name || "");
      setUsername(profile.profile?.username || "");
      setBio(profile.profile?.bio || "");
      setPhone(profile.phone || "");
      setAvatar(profile.profile?.avatar || "");
      setHidePhone(profile.profile?.hidePhone ?? true);
    }
  }, [profile]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshProfile(), refreshSummary()]);
  }, [refreshProfile, refreshSummary]);

  const showSuccess = () => {
    setSuccess(true);
    setError(null);
  };

  const saveUserFields = async (fields: {
    name?: string;
    phone?: string;
    avatar?: string;
  }) => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfile(fields);
      await refreshAll();
      showSuccess();
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

  const saveProfileDetails = async (fields: {
    username?: string;
    bio?: string;
    name?: string;
    hidePhone?: boolean;
  }) => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await updateProfileDetails(fields);
      await refreshAll();
      showSuccess();
      setEditing(null);
      resetUsernameCheck();
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("personal_info.save_error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleShowPhone = async (show: boolean) => {
    if (show && !hasSavedPhone) {
      return;
    }

    const nextHide = !show;
    const previous = hidePhone;
    setHidePhone(nextHide);
    setError(null);
    setSuccess(false);
    setSavingPhoneVisibility(true);
    try {
      await updateProfileDetails({ hidePhone: nextHide });
      await refreshAll();
      showSuccess();
    } catch (err) {
      setHidePhone(previous);
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("personal_info.save_error"),
      );
    } finally {
      setSavingPhoneVisibility(false);
    }
  };

  const cancelEdit = (field: EditingField) => {
    if (!profile) return;
    if (field === "name") setName(profile.profile?.name || "");
    if (field === "username") {
      setUsername(profile.profile?.username || "");
      resetUsernameCheck();
    }
    if (field === "bio") setBio(profile.profile?.bio || "");
    if (field === "phone") {
      setPhone(profile.phone || "");
      setPhoneStep("input");
      setOtpCode("");
      setPhoneSupportTicket(null);
    }
    setEditing(null);
  };

  const startEdit = (field: EditingField) => {
    setEditing(field);
    if (field === "username") resetUsernameCheck();
    if (field === "phone") {
      setPhoneStep("input");
      setOtpCode("");
      setPhoneSupportTicket(null);
    }
  };

  const sendPhoneOtp = async () => {
    const trimmed = phone.trim();
    if (!isValidPhoneInput(trimmed)) {
      setError(t("personal_info.phone_invalid"));
      setPhoneSupportTicket(null);
      return;
    }

    setError(null);
    setPhoneSupportTicket(null);
    setIsSendingOtp(true);
    try {
      await sendPhoneVerificationOtp(trimmed);
      setPhoneStep("verify");
      setOtpCode("");
    } catch (err) {
      setPhoneSupportTicket(extractApiTicketNumber(err) ?? null);
      setError(
        extractApiErrorMessage(err) || t("personal_info.phone_otp_send_error"),
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handlePhoneSave = async () => {
    const trimmed = phone.trim();
    const normalizedCurrent = normalizePhoneInput(savedPhone);
    const normalizedNext = normalizePhoneInput(trimmed);

    if (normalizedNext === normalizedCurrent) {
      setEditing(null);
      return;
    }

    if (!trimmed) {
      await saveUserFields({ phone: "" });
      return;
    }

    await sendPhoneOtp();
  };

  const handlePhoneVerify = async (code: string) => {
    const trimmed = phone.trim();
    if (code.length !== 6) return;

    setError(null);
    setIsVerifyingPhone(true);
    try {
      await verifyPhoneOtp(trimmed, code);
      await refreshAll();
      showSuccess();
      setEditing(null);
      setPhoneStep("input");
      setOtpCode("");
    } catch (err) {
      setError(
        (err as Error & { data?: { message?: string } }).data?.message ||
          t("personal_info.phone_otp_verify_error"),
      );
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleTaskAction = useCallback((taskId: ProfileTaskId) => {
    if (taskId === "avatar") {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const fieldMap: Record<string, EditingField> = {
      name: "name",
      username: "username",
      bio: "bio",
      phone: "phone",
    };
    const field = fieldMap[taskId];
    if (field) {
      startEdit(field);
      fieldRefs.current[field]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    const focus = searchParams.get("focus") as ProfileTaskId | null;
    const valid: ProfileTaskId[] = ["avatar", "name", "username", "bio", "phone"];
    if (focus && valid.includes(focus)) {
      handleTaskAction(focus);
      router.replace("/manage/personal-info", { scroll: false });
    }
  }, [searchParams, handleTaskAction, router]);

  const usernameChanged =
    username.trim().toLowerCase() !== currentUsername.toLowerCase();
  const usernameValid =
    username.trim().length >= 3 &&
    username.trim().length <= 30 &&
    isValidUsername(username.trim());
  const canSaveUsername =
    usernameValid &&
    (!usernameChanged || usernameAvailable === true) &&
    !isCheckingUsername;

  if (!profile) {
    return <ManageSpinner />;
  }

  return (
    <ManagePageStack>
      <ManagePageHeader
        title={t("personal_info.title")}
        titleShort={t("personal_info.title_short")}
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

      <ProfileTopSection
        heroRef={heroRef}
        avatar={avatar}
        name={displayName}
        username={profile.profile?.username}
        initials={initials}
        verified={isVerified}
        onAvatarUploaded={async (key) => {
          setAvatar(key);
          await saveUserFields({ avatar: key });
        }}
      />

      <div className="lg:hidden">
        <ManageProfileTaskSlider profile={profile} onTaskAction={handleTaskAction} />
      </div>

      <ManageGroup>
        {isVerified && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-primary">
            <VerifiedBadge size={16} />
            <span>{t("verified.badge_label")}</span>
          </div>
        )}

        <div ref={(el) => { fieldRefs.current.name = el; }}>
          <ManageInfoRow
            icon={User}
            label={t("personal_info.full_name")}
            value={editing !== "name" ? displayName || "—" : undefined}
          >
            {editing === "name" ? (
              <EditActions
                saving={saving}
                onCancel={() => cancelEdit("name")}
                onSave={() => saveUserFields({ name: name.trim() || undefined })}
                saveLabel={t("personal_info.save")}
                cancelLabel={t("cancel")}
                savingLabel={t("personal_info.saving")}
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("personal_info.full_name_placeholder")}
                  className="bg-background"
                  autoFocus
                />
              </EditActions>
            ) : (
              <EditTrigger onClick={() => startEdit("name")} label={t("personal_info.edit")} />
            )}
          </ManageInfoRow>
        </div>

        <div ref={(el) => { fieldRefs.current.username = el; }}>
          <ManageInfoRow
            icon={AtSign}
            label={t("personal_info.username")}
            value={
              editing !== "username" ? (
                profile.profile?.username ? (
                  <span dir="ltr">@{profile.profile.username}</span>
                ) : (
                  "—"
                )
              ) : undefined
            }
          >
            {editing === "username" ? (
              <EditActions
                saving={saving}
                disabled={!canSaveUsername}
                onCancel={() => cancelEdit("username")}
                onSave={() =>
                  saveProfileDetails({ username: username.trim().toLowerCase() })
                }
                saveLabel={t("personal_info.save")}
                cancelLabel={t("cancel")}
                savingLabel={t("personal_info.saving")}
              >
                <div className="space-y-1.5">
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      @
                    </span>
                    <Input
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        setUsername(value);
                        if (value !== currentUsername) scheduleUsernameCheck(value);
                        else resetUsernameCheck();
                      }}
                      dir="ltr"
                      placeholder="username"
                      className="bg-background ps-7"
                      autoFocus
                    />
                  </div>
                  <UsernameStatus
                    username={username}
                    currentUsername={currentUsername}
                    available={usernameAvailable}
                    checking={isCheckingUsername}
                    t={t}
                  />
                </div>
              </EditActions>
            ) : (
              <EditTrigger onClick={() => startEdit("username")} label={t("personal_info.edit")} />
            )}
          </ManageInfoRow>
        </div>

        <div ref={(el) => { fieldRefs.current.bio = el; }}>
          <ManageInfoRow
            icon={FileText}
            label={t("personal_info.bio")}
            value={
              editing !== "bio" ? (
                profile.profile?.bio ? (
                  <span className="whitespace-pre-wrap">{profile.profile.bio}</span>
                ) : (
                  <span className="text-muted-foreground">{t("personal_info.bio_empty")}</span>
                )
              ) : undefined
            }
          >
            {editing === "bio" ? (
              <EditActions
                saving={saving}
                onCancel={() => cancelEdit("bio")}
                onSave={() => saveProfileDetails({ bio: bio.trim() || undefined })}
                saveLabel={t("personal_info.save")}
                cancelLabel={t("cancel")}
                savingLabel={t("personal_info.saving")}
              >
                <div className="space-y-1">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    placeholder={t("personal_info.bio_placeholder")}
                    className="min-h-[100px] resize-none bg-background"
                    autoFocus
                  />
                  <p className="text-end text-xs text-muted-foreground">
                    {bio.length}/500
                  </p>
                </div>
              </EditActions>
            ) : (
              <EditTrigger onClick={() => startEdit("bio")} label={t("personal_info.edit")} />
            )}
          </ManageInfoRow>
        </div>

        <ManageInfoRow
          icon={Mail}
          label={t("personal_info.email")}
          value={
            <span dir="ltr" className="inline-flex flex-wrap items-center gap-2">
              {profile.email}
              {profile.emailVerified ? (
                <span className="text-xs text-muted-foreground">
                  · {t("badges.verified")}
                </span>
              ) : (
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  · {t("personal_info.email_unverified")}
                </span>
              )}
            </span>
          }
        >
          {!profile.emailVerified ? (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/verify-email")}
              >
                {t("personal_info.email_verify")}
              </Button>
            </div>
          ) : null}
        </ManageInfoRow>

        <div ref={(el) => { fieldRefs.current.phone = el; }}>
          <ManageInfoRow
            icon={Phone}
            label={t("personal_info.phone")}
            value={editing !== "phone" ? phone || "—" : undefined}
          >
            {editing === "phone" ? (
              phoneStep === "verify" ? (
                <div className="mt-2 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {t("personal_info.phone_otp_sent", { phone: phone.trim() })}
                  </p>
                  <OtpCodeInput
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value);
                      if (value.length === 6) {
                        void handlePhoneVerify(value);
                      }
                    }}
                    disabled={isVerifyingPhone || isSendingOtp}
                    aria-label={t("personal_info.phone_otp_label")}
                    aria-invalid={Boolean(error)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={
                        isVerifyingPhone || otpCode.length !== 6 || isSendingOtp
                      }
                      onClick={() => void handlePhoneVerify(otpCode)}
                    >
                      {isVerifyingPhone
                        ? t("personal_info.phone_verifying")
                        : t("personal_info.phone_confirm")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSendingOtp || isVerifyingPhone}
                      onClick={() => void sendPhoneOtp()}
                    >
                      {isSendingOtp
                        ? t("personal_info.phone_sending_otp")
                        : t("personal_info.phone_resend_otp")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isVerifyingPhone || isSendingOtp}
                      onClick={() => {
                        setPhoneStep("input");
                        setOtpCode("");
                        setError(null);
                      }}
                    >
                      {t("personal_info.phone_change_number")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isVerifyingPhone || isSendingOtp}
                      onClick={() => cancelEdit("phone")}
                    >
                      <X className="me-1 size-3.5" />
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : (
                <EditActions
                  saving={saving || isSendingOtp}
                  disabled={!isValidPhoneInput(phone) && Boolean(phone.trim())}
                  onCancel={() => cancelEdit("phone")}
                  onSave={() => void handlePhoneSave()}
                  saveLabel={
                    phone.trim()
                      ? t("personal_info.phone_send_otp")
                      : t("personal_info.save")
                  }
                  cancelLabel={t("cancel")}
                  savingLabel={t("personal_info.phone_sending_otp")}
                >
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    placeholder="+964..."
                    className="bg-background"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("personal_info.phone_verify_hint")}
                  </p>
                  {phoneSupportTicket ? (
                    <p className="text-xs text-muted-foreground">
                      {t("personal_info.phone_support_ticket", {
                        number: phoneSupportTicket,
                      })}{" "}
                      <Link
                        href="/manage/support"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {t("personal_info.phone_support_link")}
                      </Link>
                    </p>
                  ) : null}
                </EditActions>
              )
            ) : (
              <EditTrigger onClick={() => startEdit("phone")} label={t("personal_info.edit")} />
            )}
          </ManageInfoRow>
        </div>

        <div className={cn("flex items-center gap-4 px-4 py-4", ui.divider)}>
          <ManageIconCircle icon={Eye} muted />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              {t("personal_info.show_phone")}
            </p>
            <p className="mt-1 text-sm text-foreground">
              {hasSavedPhone
                ? t("personal_info.show_phone_desc")
                : t("personal_info.show_phone_need_number")}
            </p>
          </div>
          <Switch
            checked={!hidePhone}
            disabled={!hasSavedPhone || savingPhoneVisibility || saving}
            onCheckedChange={toggleShowPhone}
            id="show-phone-on-profile"
          />
        </div>
      </ManageGroup>

      {publicProfileUrl && (
        <ProfilePublicSection
          publicProfileUrl={publicProfileUrl}
          name={displayName}
          username={profile.profile?.username}
          bio={profile.profile?.bio}
          avatar={avatar}
          verified={isVerified}
        />
      )}

      <DangerZonePanel />
    </ManagePageStack>
  );
}

function EditTrigger({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 text-xs text-primary hover:underline"
    >
      {label}
    </button>
  );
}

function EditActions({
  children,
  saving,
  disabled,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  savingLabel,
}: {
  children: React.ReactNode;
  saving: boolean;
  disabled?: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  cancelLabel: string;
  savingLabel: string;
}) {
  return (
    <div className="mt-2 space-y-2">
      {children}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={saving || disabled} onClick={onSave}>
          {saving ? savingLabel : saveLabel}
        </Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={onCancel}>
          <X className="me-1 size-3.5" />
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}

function UsernameStatus({
  username,
  currentUsername,
  available,
  checking,
  t,
}: {
  username: string;
  currentUsername: string;
  available: boolean | null;
  checking: boolean;
  t: ReturnType<typeof useTranslations<"Manage">>;
}) {
  if (username.trim().toLowerCase() === currentUsername.toLowerCase()) {
    return (
      <p className="text-xs text-muted-foreground">{t("personal_info.username_unchanged")}</p>
    );
  }

  if (username.length > 0 && username.length < 3) {
    return (
      <p className="text-xs text-destructive">{t("personal_info.username_too_short")}</p>
    );
  }

  if (username.length > 0 && !isValidUsername(username)) {
    return (
      <p className="text-xs text-destructive">{t("personal_info.username_invalid")}</p>
    );
  }

  if (checking) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        {t("personal_info.username_checking")}
      </p>
    );
  }

  if (available === true) {
    return (
      <p className="flex items-center gap-1 text-xs text-emerald-600">
        <Check className="size-3" />
        {t("personal_info.username_available")}
      </p>
    );
  }

  if (available === false) {
    return (
      <p className="text-xs text-destructive">{t("personal_info.username_taken")}</p>
    );
  }

  return null;
}
