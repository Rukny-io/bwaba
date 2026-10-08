"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Description, Input, Label, Switch, TextField } from "@heroui/react";
import { Check, Copy } from "lucide-react";
import {
  MAIL_SSO_ROLE_OPTIONS,
  MailSsoSelect,
  copyToClipboard,
} from "@/components/app/sso/mail-sso-select";
import {
  deleteMailIdentityProvider,
  getMailIdentityProvider,
  saveMailIdentityProvider,
  testMailIdentityProvider,
  type MailIdentityProviderConfig,
  type MailIdentityProviderPreset,
  type MailIdentityProviderSummary,
  type MailSsoProvisionInput,
} from "@/lib/mail-sso-client";

type Role = MailSsoProvisionInput["role"];

const PRESETS: {
  value: MailIdentityProviderPreset;
  label: string;
  hint: string;
}[] = [
  { value: "GOOGLE_WORKSPACE", label: "Google Workspace", hint: "OAuth client in Google Cloud" },
  { value: "MICROSOFT_ENTRA", label: "Microsoft Entra ID", hint: "App registration in Azure" },
  { value: "CUSTOM", label: "Other OIDC provider", hint: "Okta, Auth0, Keycloak…" },
];

const GOOGLE_ISSUER = "https://accounts.google.com";

function entraIssuer(tenantId: string) {
  return `https://login.microsoftonline.com/${tenantId.trim()}/v2.0`;
}

function tenantFromIssuer(issuer: string) {
  return issuer.match(/login\.microsoftonline\.com\/([^/]+)\/v2\.0/i)?.[1] ?? "";
}

const SETUP_STEPS: Record<MailIdentityProviderPreset, string[]> = {
  GOOGLE_WORKSPACE: [
    "Google Cloud console → APIs & Services → Credentials → Create OAuth client ID (Web application).",
    "Add the redirect URI below as an authorized redirect URI.",
    "Set the OAuth consent screen to Internal so only your Workspace can sign in.",
  ],
  MICROSOFT_ENTRA: [
    "Entra admin center → App registrations → New registration (single tenant).",
    "Add the redirect URI below under Web → Redirect URIs.",
    "Certificates & secrets → New client secret. Copy the Directory (tenant) ID too.",
  ],
  CUSTOM: [
    "Create an OIDC web application with the authorization code flow.",
    "Add the redirect URI below and allow the openid, email and profile scopes.",
    "Paste the issuer URL (we read /.well-known/openid-configuration).",
  ],
};

function PolicySwitch({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      isSelected={value}
      isDisabled={disabled}
      className="w-full justify-between"
      onChange={onChange}
    >
      <Switch.Content>
        <Label>{label}</Label>
        <Description>{description}</Description>
      </Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch>
  );
}

type Draft = {
  preset: MailIdentityProviderPreset;
  tenantId: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
  jitProvisioning: boolean;
  defaultRole: Role;
  enforceSso: boolean;
  autoMapMailboxByLocalPart: boolean;
};

function draftFrom(config: MailIdentityProviderConfig | null): Draft {
  return {
    preset: config?.preset ?? "GOOGLE_WORKSPACE",
    tenantId: config ? tenantFromIssuer(config.issuer) : "",
    issuer: config?.issuer ?? GOOGLE_ISSUER,
    clientId: config?.clientId ?? "",
    clientSecret: "",
    jitProvisioning: config?.jitProvisioning ?? true,
    defaultRole: config?.defaultRole ?? "MEMBER",
    enforceSso: config?.enforceSso ?? false,
    autoMapMailboxByLocalPart: config?.autoMapMailboxByLocalPart ?? true,
  };
}

function resolvedIssuer(draft: Draft) {
  if (draft.preset === "GOOGLE_WORKSPACE") return GOOGLE_ISSUER;
  if (draft.preset === "MICROSOFT_ENTRA") return entraIssuer(draft.tenantId);
  return draft.issuer.trim();
}

export function MailSsoEnterpriseCard({
  appId,
  summary,
  canManage,
  primaryDomain,
  domainActive,
  onChanged,
}: {
  appId: string;
  summary: MailIdentityProviderSummary | null;
  canManage: boolean;
  primaryDomain: string | null;
  domainActive: boolean;
  onChanged: () => void;
}) {
  const [config, setConfig] = useState<MailIdentityProviderConfig | null>(null);
  const [redirectUri, setRedirectUri] = useState("");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(null));
  const [loading, setLoading] = useState(canManage);
  const [busy, setBusy] = useState<"save" | "enable" | "test" | "delete" | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!canManage) return;
    try {
      const data = await getMailIdentityProvider(appId);
      setConfig(data.identityProvider);
      setRedirectUri(data.redirectUri);
      setDraft(draftFrom(data.identityProvider));
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [appId, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));
  const issuer = resolvedIssuer(draft);
  const ready =
    domainActive &&
    !!draft.clientId.trim() &&
    (config?.hasClientSecret || !!draft.clientSecret.trim()) &&
    (draft.preset !== "MICROSOFT_ENTRA" || /^[0-9a-f-]{36}$/i.test(draft.tenantId.trim())) &&
    /^https?:\/\//.test(issuer);
  const disabled = !canManage || busy !== null || !domainActive;

  async function save(enabled?: boolean) {
    setBusy(enabled === undefined ? "save" : "enable");
    setNotice(null);
    try {
      const data = await saveMailIdentityProvider(appId, {
        preset: draft.preset,
        issuer,
        clientId: draft.clientId.trim(),
        ...(draft.clientSecret.trim() ? { clientSecret: draft.clientSecret.trim() } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        jitProvisioning: draft.jitProvisioning,
        defaultRole: draft.defaultRole,
        enforceSso: draft.enforceSso,
        autoMapMailboxByLocalPart: draft.autoMapMailboxByLocalPart,
      });
      setConfig(data.identityProvider);
      setRedirectUri(data.redirectUri);
      setDraft(draftFrom(data.identityProvider));
      setNotice({
        tone: "ok",
        text:
          enabled === true
            ? `SSO is on. People at @${primaryDomain} can use "Sign in with SSO".`
            : enabled === false
              ? "SSO is off. Existing sessions keep working."
              : "Saved.",
      });
      onChanged();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function test() {
    setBusy("test");
    setNotice(null);
    try {
      const result = await testMailIdentityProvider(appId);
      setConfig(result.identityProvider);
      setNotice(
        result.ok
          ? { tone: "ok", text: "Connection works: discovery document and keys loaded." }
          : { tone: "error", text: result.error || "Connection failed." },
      );
      onChanged();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect the identity provider? People will sign in with Rukny again.")) {
      return;
    }
    setBusy("delete");
    setNotice(null);
    try {
      await deleteMailIdentityProvider(appId);
      setConfig(null);
      setDraft(draftFrom(null));
      setNotice({ tone: "ok", text: "Identity provider disconnected." });
      onChanged();
    } catch (error) {
      setNotice({ tone: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  const enabled = config?.enabled ?? summary?.enabled ?? false;

  return (
    <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            Enterprise SSO
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
            Let people at{" "}
            <span dir="ltr" className="font-medium text-[var(--foreground)]">
              @{primaryDomain || "your-domain"}
            </span>{" "}
            sign in with your company identity provider (OIDC).
          </p>
        </div>
        <span
          className={
            enabled
              ? "rounded-full bg-[var(--success-soft,#e7f6ec)] px-2.5 py-1 text-[12px] font-medium text-[var(--success,#1a7f37)]"
              : "rounded-full bg-[var(--default)] px-2.5 py-1 text-[12px] font-medium text-[var(--muted-foreground)]"
          }
        >
          {enabled ? "On" : config ? "Off" : "Not connected"}
        </span>
      </div>

      {!domainActive ? (
        <p className="rounded-xl bg-[var(--default)] px-3 py-2.5 text-[13px] text-[var(--muted-foreground)]">
          Verify your workspace domain first. Enterprise SSO only trusts email addresses on a
          domain you own.
        </p>
      ) : null}
      {!canManage ? (
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Only the owner or an admin can configure enterprise SSO.
        </p>
      ) : null}

      {canManage && domainActive && !loading ? (
        <>
          <div className="grid min-w-0 gap-2 sm:grid-cols-3">
            {PRESETS.map((preset) => {
              const selected = draft.preset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    patch({
                      preset: preset.value,
                      issuer: preset.value === "CUSTOM" ? (config?.preset === "CUSTOM" ? config.issuer : "") : draft.issuer,
                    })
                  }
                  className={`min-w-0 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent-soft,transparent)]"
                      : "border-[var(--border)] hover:bg-[var(--default)]"
                  }`}
                >
                  <span className="block text-[13px] font-medium text-[var(--foreground)]">
                    {preset.label}
                  </span>
                  <span className="block text-[12px] text-[var(--muted-foreground)]">
                    {preset.hint}
                  </span>
                </button>
              );
            })}
          </div>

          <ol className="list-decimal space-y-1 ps-5 text-[13px] leading-5 text-[var(--muted-foreground)]">
            {SETUP_STEPS[draft.preset].map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="min-w-0">
            <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
              Redirect URI
            </Label>
            <div className="flex min-w-0 items-center gap-2">
              <code
                dir="ltr"
                className="min-w-0 flex-1 truncate rounded-xl bg-[var(--default)] px-3 py-2.5 text-[12px] text-[var(--foreground)]"
              >
                {redirectUri}
              </code>
              <Button
                isIconOnly
                variant="ghost"
                aria-label="Copy redirect URI"
                className="shrink-0 rounded-full"
                onPress={async () => {
                  if (await copyToClipboard(redirectUri)) {
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {draft.preset === "MICROSOFT_ENTRA" ? (
              <TextField
                fullWidth
                className="min-w-0 gap-1.5"
                value={draft.tenantId}
                onChange={(tenantId) => patch({ tenantId })}
                isDisabled={disabled}
                isInvalid={draft.tenantId.length > 0 && !/^[0-9a-f-]{36}$/i.test(draft.tenantId.trim())}
              >
                <Label className="text-[13px] font-medium text-[var(--foreground)]">
                  Directory (tenant) ID
                </Label>
                <Input dir="ltr" placeholder="00000000-0000-0000-0000-000000000000" className="h-11 rounded-xl" />
              </TextField>
            ) : null}
            {draft.preset === "CUSTOM" ? (
              <TextField
                fullWidth
                className="min-w-0 gap-1.5"
                value={draft.issuer}
                onChange={(value) => patch({ issuer: value })}
                isDisabled={disabled}
              >
                <Label className="text-[13px] font-medium text-[var(--foreground)]">Issuer URL</Label>
                <Input dir="ltr" placeholder="https://acme.okta.com" className="h-11 rounded-xl" />
              </TextField>
            ) : null}
            <TextField
              fullWidth
              className="min-w-0 gap-1.5"
              value={draft.clientId}
              onChange={(clientId) => patch({ clientId })}
              isDisabled={disabled}
            >
              <Label className="text-[13px] font-medium text-[var(--foreground)]">Client ID</Label>
              <Input dir="ltr" autoComplete="off" className="h-11 rounded-xl" />
            </TextField>
            <TextField
              fullWidth
              className="min-w-0 gap-1.5"
              type="password"
              value={draft.clientSecret}
              onChange={(clientSecret) => patch({ clientSecret })}
              isDisabled={disabled}
            >
              <Label className="text-[13px] font-medium text-[var(--foreground)]">Client secret</Label>
              <Input
                dir="ltr"
                autoComplete="new-password"
                placeholder={config?.hasClientSecret ? "Saved — leave empty to keep" : ""}
                className="h-11 rounded-xl"
              />
            </TextField>
          </div>

          <div className="flex min-w-0 flex-col gap-4 border-t border-[var(--border)] pt-4">
            <PolicySwitch
              label="Create accounts on first sign-in"
              description={`Anyone at @${primaryDomain} who signs in gets a seat automatically. Off: only invited people.`}
              value={draft.jitProvisioning}
              disabled={disabled}
              onChange={(jitProvisioning) => patch({ jitProvisioning })}
            />
            {draft.jitProvisioning ? (
              <div className="grid min-w-0 gap-1.5 sm:max-w-[16rem]">
                <Label className="text-[13px] font-medium text-[var(--foreground)]">
                  Role for new people
                </Label>
                <MailSsoSelect
                  label="Default role"
                  value={draft.defaultRole}
                  options={MAIL_SSO_ROLE_OPTIONS}
                  disabled={disabled}
                  onChange={(defaultRole) => patch({ defaultRole })}
                />
              </div>
            ) : null}
            <PolicySwitch
              label="Match mailbox by name"
              description={`sara@${primaryDomain} gets the unassigned mailbox sara@${primaryDomain} on first sign-in.`}
              value={draft.autoMapMailboxByLocalPart}
              disabled={disabled}
              onChange={(autoMapMailboxByLocalPart) => patch({ autoMapMailboxByLocalPart })}
            />
            <PolicySwitch
              label="Require SSO"
              description="Members on your domain can no longer unlock mailboxes with a password. The owner is never locked out."
              value={draft.enforceSso}
              disabled={disabled}
              onChange={(enforceSso) => patch({ enforceSso })}
            />
          </div>

          {config?.lastTestedAt ? (
            <p className="text-[12px] text-[var(--muted-foreground)]">
              Last test {new Date(config.lastTestedAt).toLocaleString()}:{" "}
              {config.lastTestError ? (
                <span className="text-[var(--danger)]">{config.lastTestError}</span>
              ) : (
                "OK"
              )}
            </p>
          ) : null}

          {notice ? (
            <p
              role={notice.tone === "error" ? "alert" : "status"}
              className={`text-[13px] ${notice.tone === "error" ? "text-[var(--danger)]" : "text-[var(--success,#1a7f37)]"}`}
            >
              {notice.text}
            </p>
          ) : null}

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {enabled ? (
              <>
                <Button className="h-10 rounded-full px-4" isDisabled={disabled || !ready} isPending={busy === "save"} onPress={() => void save()}>
                  Save changes
                </Button>
                <Button variant="secondary" className="h-10 rounded-full px-4" isDisabled={disabled} isPending={busy === "enable"} onPress={() => void save(false)}>
                  Turn off
                </Button>
              </>
            ) : (
              <>
                <Button className="h-10 rounded-full px-4" isDisabled={disabled || !ready} isPending={busy === "enable"} onPress={() => void save(true)}>
                  Save &amp; turn on
                </Button>
                <Button variant="secondary" className="h-10 rounded-full px-4" isDisabled={disabled || !ready} isPending={busy === "save"} onPress={() => void save()}>
                  Save as draft
                </Button>
              </>
            )}
            {config ? (
              <>
                <Button variant="ghost" className="h-10 rounded-full px-4" isDisabled={disabled} isPending={busy === "test"} onPress={() => void test()}>
                  Test connection
                </Button>
                <Button variant="danger" className="ms-auto h-10 rounded-full px-4" isDisabled={disabled} isPending={busy === "delete"} onPress={() => void disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
