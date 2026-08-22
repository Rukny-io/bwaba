"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { resolveAccountsUrl } from "@rukny/auth/client/env-urls";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  Description,
  Input,
  Label,
  Link,
  Skeleton,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { fetchCurrentUser, type AuthUser } from "@/lib/api/auth";
import { useMailTheme } from "@/components/theme-sync";
import { readMailAppIdFromDocument, clearMailAppIdCookie } from "@/lib/mail-app-id";
import {
  archiveMailApp,
  getMailApp,
  updateMailApp,
  type MailApp,
} from "@/lib/mail-apps-client";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import { writeMailDomainSetup } from "@/lib/mail-domain-storage";
import { logoutAndRedirect } from "@/lib/logout";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { formatMailStorageAmount } from "@/lib/mail-plans";
import { MailPersonAvatar } from "@/components/inbox/mail-person-avatar";
import { MailPlanSettingsSection } from "@/components/billing/mail-billing-settings";

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function domainStatusLabel(status: MailApp["domainStatus"]) {
  switch (status) {
    case "ACTIVE":
      return "Verified";
    case "VERIFYING":
      return "Checking";
    case "PENDING_DNS":
      return "Pending DNS";
    case "FAILED":
      return "Failed";
    default:
      return "Not connected";
  }
}

function domainChipColor(
  status: MailApp["domainStatus"],
): "success" | "warning" | "danger" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "FAILED") return "danger";
  if (status === "VERIFYING" || status === "PENDING_DNS") return "warning";
  return "default";
}

export function MailSettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);
  const accountsBase = resolveAccountsUrl().replace(/\/$/, "");

  const { theme, setTheme } = useMailTheme();
  const [themeReady, setThemeReady] = useState(false);

  const [appId, setAppId] = useState<string | null>(null);
  const [app, setApp] = useState<MailApp | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [nextApp, boxes, session] = await Promise.all([
        getMailApp(id),
        listMailMailboxes(id),
        fetchCurrentUser(),
      ]);
      setApp(nextApp);
      setMailboxes(boxes.filter((box) => box.status !== "DELETED"));
      setUser(session);
      setName(nextApp.name);
      setContactEmail(nextApp.contactEmail || "");
      setDescription(nextApp.description || "");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  const activeMailboxes = useMemo(
    () => mailboxes.filter((box) => box.status === "ACTIVE"),
    [mailboxes],
  );
  const storageUsed = useMemo(
    () => mailboxes.reduce((sum, box) => sum + (box.storageUsedBytes || 0), 0),
    [mailboxes],
  );

  const dirty = Boolean(
    app &&
      (name.trim() !== app.name ||
        contactEmail.trim().toLowerCase() !== (app.contactEmail || "").toLowerCase() ||
        description.trim() !== (app.description || "")),
  );

  const canSave =
    Boolean(appId) &&
    !saving &&
    dirty &&
    name.trim().length >= 2 &&
    looksLikeEmail(contactEmail);

  async function onSave() {
    if (!appId || !canSave) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateMailApp(appId, {
        name: name.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        description: description.trim(),
      });
      setApp(updated);
      setName(updated.name);
      setContactEmail(updated.contactEmail || "");
      setDescription(updated.description || "");
      setError("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive() {
    if (!appId || !app) return;
    if (
      !window.confirm(
        `Archive ${app.name}? This Mail app will leave the workspace. You can still open other apps.`,
      )
    ) {
      return;
    }
    setArchiving(true);
    try {
      await archiveMailApp(appId);
      writeMailDomainSetup(null, appId);
      clearMailAppIdCookie();
      window.location.assign("/apps");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive this Mail app.");
      setArchiving(false);
    }
  }

  const selectedTheme = themeReady ? theme || "light" : "light";

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          App identity, appearance, plan, and your Rukny account.
        </p>
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Settings</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {saved && !error ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Saved</Alert.Title>
            <Alert.Description>App details were updated.</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--foreground)]">App</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  This name appears in the app picker. Category cannot be changed.
                </p>
              </div>
              <Chip size="sm" variant="soft">
                {app?.appType === "CONSUMER" ? "Consumer" : "Business"}
              </Chip>
            </div>

            <TextField
              isRequired
              fullWidth
              className="gap-1.5"
              value={name}
              onChange={setName}
              isDisabled={saving}
              maxLength={80}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Application name
              </Label>
              <Input placeholder="Acme Mail" autoComplete="off" />
            </TextField>

            <TextField
              isRequired
              type="email"
              fullWidth
              className="gap-1.5"
              value={contactEmail}
              onChange={(value) => setContactEmail(value.trim())}
              isDisabled={saving}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Official contact email
              </Label>
              <Input
                type="email"
                placeholder="mail@company.com"
                autoComplete="off"
                dir="ltr"
              />
              <Description>
                Used for notices if this Mail app needs recovery.
              </Description>
            </TextField>

            <TextField
              fullWidth
              className="gap-1.5"
              value={description}
              onChange={setDescription}
              isDisabled={saving}
              maxLength={280}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Description
              </Label>
              <TextArea
                rows={3}
                className="min-h-20"
                placeholder="Optional note about this workspace"
              />
            </TextField>

            <div className="flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--surface-secondary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">Domain</p>
                <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]" dir="ltr">
                  {app?.primaryDomain || "No domain connected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Chip
                  color={domainChipColor(app?.domainStatus)}
                  size="sm"
                  variant="soft"
                >
                  {domainStatusLabel(app?.domainStatus)}
                </Chip>
                <Button size="sm" variant="ghost" onPress={() => router.push(href("/domain"))}>
                  Domain settings
                </Button>
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted-foreground)]">Active mailboxes</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {activeMailboxes.length}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Stored mail</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {formatMailStorageAmount(storageUsed)}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onPress={() => router.push(href("/app"))}>
                Mailboxes
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push("/apps")}>
                Switch app
              </Button>
            </div>

            <div className="flex justify-end">
              <Button size="sm" isDisabled={!canSave} onPress={() => void onSave()}>
                {saving ? "Saving…" : "Save app details"}
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Theme for this browser only. It does not change how mail is sent.
              </p>
            </div>
            <ToggleButtonGroup
              disallowEmptySelection
              selectionMode="single"
              size="sm"
              selectedKeys={new Set([selectedTheme])}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next == null) return;
                setTheme(String(next));
              }}
            >
              {THEME_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                return (
                  <ToggleButton key={option.id} id={option.id} isDisabled={!themeReady}>
                    {index > 0 ? <ToggleButtonGroup.Separator /> : null}
                    <Icon className="size-4" strokeWidth={1.8} />
                    {option.label}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </div>

          <MailPlanSettingsSection />

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Account</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Name, email, and security are managed in Rukny Accounts.
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <MailPersonAvatar
                name={user?.name || user?.username || user?.email || "Account"}
                email={user?.email}
                avatarUrl={user?.avatar}
                className="size-11"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {user?.name || user?.username || "Signed in"}
                </p>
                <p className="truncate text-sm text-[var(--muted-foreground)]" dir="ltr">
                  {user?.email || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`${accountsBase}/manage/personal-info`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Personal info
                <Link.Icon />
              </Link>
              <Link
                href={`${accountsBase}/manage/security`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Password and security
                <Link.Icon />
              </Link>
              <Link
                href={`${accountsBase}/manage`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
              >
                Open account dashboard
                <Link.Icon />
              </Link>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => void logoutAndRedirect()}
              >
                Sign out
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Danger zone</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Archive removes this Mail app from your picker. Mailboxes are not wiped.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="danger"
                isDisabled={archiving}
                onPress={() => void onArchive()}
              >
                {archiving ? "Archiving…" : "Archive Mail app"}
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
