"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Button,
  Chip,
  Description,
  Input,
  Label,
  Skeleton,
  Switch,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { useMailTheme } from "@/components/theme-sync";
import { readMailAppIdFromDocument, clearMailAppIdCookie } from "@/lib/mail-app-id";
import {
  archiveMailApp,
  getMailApp,
  updateMailApp,
  type MailApp,
} from "@/lib/mail-apps-client";
import { writeMailDomainSetup } from "@/lib/mail-domain-storage";
import {
  readMailUiPreferences,
  writeMailUiPreferences,
  type MailUiPreferences,
} from "@/lib/mail-preferences";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";

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
  const { theme, setTheme } = useMailTheme();

  const [appId, setAppId] = useState<string | null>(null);
  const [app, setApp] = useState<MailApp | null>(null);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const [prefs, setPrefs] = useState<MailUiPreferences>(() => readMailUiPreferences());

  useEffect(() => {
    setThemeReady(true);
    setPrefs(readMailUiPreferences());
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
      const nextApp = await getMailApp(id);
      setApp(nextApp);
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

  const canEditApp = Boolean(app?.isOwner);
  const dirty = Boolean(
    app &&
      canEditApp &&
      (name.trim() !== app.name ||
        contactEmail.trim().toLowerCase() !== (app.contactEmail || "").toLowerCase() ||
        description.trim() !== (app.description || "")),
  );

  const canSave =
    Boolean(appId) &&
    canEditApp &&
    !saving &&
    dirty &&
    name.trim().length >= 2 &&
    looksLikeEmail(contactEmail);

  const selectedTheme = themeReady ? theme || "light" : "light";

  function patchPrefs(partial: Partial<MailUiPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      writeMailUiPreferences(next);
      return next;
    });
  }

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

  async function onSaveSignature() {
    setSavingPrefs(true);
    try {
      writeMailUiPreferences(prefs);
      setSignatureSaved(true);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function onArchive() {
    if (!appId || !app) return;
    if (
      !window.confirm(
        `Archive ${app.name}? This workspace will leave your picker. You can still open other workspaces.`,
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
      setError(err instanceof Error ? err.message : "Could not archive this workspace.");
      setArchiving(false);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Preferences and customizations for this workspace and browser.
        </p>
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {saved && !error ? (
        <MailNotice
          status="success"
          title="Saved"
          description="Workspace settings were updated."
          onDismiss={() => setSaved(false)}
        />
      ) : null}

      {signatureSaved && !error ? (
        <MailNotice
          status="success"
          title="Saved"
          description="Compose signature was updated."
          onDismiss={() => setSignatureSaved(false)}
        />
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
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Appearance</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Theme for this browser only.
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

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Alerts while you use Mail in this browser.
              </p>
            </div>

            <Switch
              isSelected={prefs.notifyNewMail}
              className="w-full justify-between"
              onChange={(value) => patchPrefs({ notifyNewMail: value })}
            >
              <Switch.Content>
                <Label>New mail badges</Label>
                <Description>Highlight unread counts in the sidebar.</Description>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>

            <Switch
              isSelected={prefs.notifyDesktop}
              className="w-full justify-between"
              onChange={(value) => patchPrefs({ notifyDesktop: value })}
            >
              <Switch.Content>
                <Label>Desktop notifications</Label>
                <Description>Ask the browser for permission when supported.</Description>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>

            <Switch
              isSelected={prefs.notifySound}
              className="w-full justify-between"
              onChange={(value) => patchPrefs({ notifySound: value })}
            >
              <Switch.Content>
                <Label>Sound</Label>
                <Description>Play a short tone for new messages.</Description>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                Compose signature
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Default signature inserted from Compose when no mailbox-specific one exists.
              </p>
            </div>
            <TextField
              fullWidth
              className="gap-1.5"
              value={prefs.defaultSignature}
              onChange={(value) => setPrefs((prev) => ({ ...prev, defaultSignature: value }))}
              maxLength={2000}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">Signature</Label>
              <TextArea
                rows={4}
                className="min-h-24"
                placeholder="Best regards,&#10;Your name"
              />
            </TextField>
            <div className="flex justify-end">
              <Button size="sm" isDisabled={savingPrefs} onPress={() => void onSaveSignature()}>
                {savingPrefs ? "Saving…" : "Save signature"}
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">
                More customizations
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Mailbox-level tools live on their own pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onPress={() => router.push(href("/auto-reply"))}>
                Automatic reply
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push(href("/aliases"))}>
                Email aliases
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push(href("/forwarders"))}>
                Forwarders
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push(href("/team"))}>
                Team access
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.push("/billing")}>
                Billing & payments
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Workspace
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Name and contact details shown in the app picker. Category cannot be
                  changed.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {app?.isOwner === false ? (
                  <Chip size="sm" variant="soft" color="warning">
                    {app.membershipRole || "Member"}
                  </Chip>
                ) : null}
                <Chip size="sm" variant="soft">
                  {app?.appType === "CONSUMER" ? "Consumer" : "Business"}
                </Chip>
              </div>
            </div>

            {!canEditApp ? (
              <MailNotice
                status="default"
                title="View only"
                description="Only the workspace owner can edit these settings or archive this workspace."
              />
            ) : null}

            <TextField
              isRequired
              fullWidth
              className="gap-1.5"
              value={name}
              onChange={setName}
              isDisabled={saving || !canEditApp}
              maxLength={80}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Workspace name
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
              isDisabled={saving || !canEditApp}
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
                Used for notices if this workspace needs recovery.
              </Description>
            </TextField>

            <TextField
              fullWidth
              className="gap-1.5"
              value={description}
              onChange={setDescription}
              isDisabled={saving || !canEditApp}
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

            <div className="flex justify-end">
              {canEditApp ? (
                <Button size="sm" isDisabled={!canSave} onPress={() => void onSave()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--foreground)]">Domain</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Connect and verify the sending domain for this workspace.
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--surface-secondary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-medium text-[var(--foreground)]"
                  dir="ltr"
                >
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
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => router.push(href("/domain"))}
                >
                  Domain settings
                </Button>
              </div>
            </div>
          </div>

          {canEditApp ? (
            <div className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Danger zone
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Archive removes this workspace from your picker. Mailboxes are not wiped.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="danger"
                  isDisabled={archiving}
                  onPress={() => void onArchive()}
                >
                  {archiving ? "Archiving…" : "Archive workspace"}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
