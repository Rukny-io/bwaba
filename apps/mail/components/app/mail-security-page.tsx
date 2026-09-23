"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Shield, Trash2 } from "lucide-react";
import {
  Button,
  Chip,
  Description,
  Dropdown,
  EmptyState,
  Input,
  Label,
  Skeleton,
  Switch,
  TextField,
  cn,
} from "@heroui/react";
import { MailNotice } from "@/components/app/mail-notice";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  createMailFilterRule,
  deleteMailFilterRule,
  getMailSecuritySettings,
  listMailFilterRules,
  updateMailFilterRule,
  updateMailSecuritySettings,
  type MailFilterAction,
  type MailFilterMatchField,
  type MailFilterRuleType,
  type MailFilterRuleView,
  type MailSecuritySettingsView,
} from "@/lib/mail-filter-rules-client";

type SecurityTab = "blocklist" | "allowlist" | "filters" | "settings";

const TABS: { id: SecurityTab; label: string }[] = [
  { id: "blocklist", label: "Blocklist" },
  { id: "allowlist", label: "Allowlist" },
  { id: "filters", label: "Filter rules" },
  { id: "settings", label: "Settings" },
];

const MATCH_FIELDS: { value: MailFilterMatchField; label: string }[] = [
  { value: "SENDER", label: "Sender email" },
  { value: "DOMAIN", label: "Sender domain" },
  { value: "SUBJECT", label: "Subject contains" },
  { value: "RECIPIENT", label: "Recipient address" },
  { value: "SENDER_REGEX", label: "Sender regex (Premium)" },
  { value: "SUBJECT_REGEX", label: "Subject regex (Premium)" },
];

function ruleTypeForTab(tab: SecurityTab): MailFilterRuleType | undefined {
  if (tab === "blocklist") return "BLOCKLIST";
  if (tab === "allowlist") return "ALLOWLIST";
  if (tab === "filters") return "FILTER";
  return undefined;
}

function defaultAction(tab: SecurityTab): MailFilterAction {
  if (tab === "allowlist") return "INBOX";
  if (tab === "filters") return "QUARANTINE";
  return "SPAM";
}

function actionOptions(tab: SecurityTab): { value: MailFilterAction; label: string }[] {
  if (tab === "allowlist") return [{ value: "INBOX", label: "Allow (inbox)" }];
  if (tab === "blocklist") {
    return [
      { value: "SPAM", label: "Move to spam" },
      { value: "DELETE", label: "Reject (do not store)" },
    ];
  }
  return [
    { value: "QUARANTINE", label: "Quarantine" },
    { value: "SPAM", label: "Spam" },
    { value: "INBOX", label: "Inbox" },
    { value: "PROMOTIONS", label: "Promotions" },
    { value: "SOCIAL", label: "Social" },
    { value: "DELETE", label: "Reject" },
  ];
}

function matchFieldLabel(field: MailFilterMatchField) {
  return MATCH_FIELDS.find((item) => item.value === field)?.label ?? field;
}

function actionLabel(action: MailFilterAction) {
  if (action === "DELETE") return "Reject";
  if (action === "QUARANTINE") return "Quarantine";
  return action.charAt(0) + action.slice(1).toLowerCase();
}

function ScopeDropdown({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const selectedLabel =
    options.find((option) => option.id === value)?.label ?? "All mailboxes";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Mailbox scope"
        isDisabled={disabled}
        className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate" dir="ltr">{selectedLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-[16rem] overflow-hidden rounded-2xl">
        <Dropdown.Menu
          selectedKeys={new Set([value])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            onChange(String(next));
          }}
        >
          <Dropdown.Section>
            {options.map((option) => (
              <Dropdown.Item key={option.id} id={option.id} textValue={option.label}>
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

function SelectDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        isDisabled={disabled}
        className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom start" className="min-w-[12rem] overflow-hidden rounded-2xl">
        <Dropdown.Menu
          selectedKeys={new Set([value])}
          selectionMode="single"
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = [...keys][0];
            if (next == null) return;
            onChange(String(next) as T);
          }}
        >
          <Dropdown.Section>
            {options.map((option) => (
              <Dropdown.Item key={option.value} id={option.value} textValue={option.label}>
                <Dropdown.ItemIndicator />
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function MailSecurityPage() {
  const [appId, setAppId] = useState<string | null>(null);
  const [tab, setTab] = useState<SecurityTab>("blocklist");
  const [rules, setRules] = useState<MailFilterRuleView[]>([]);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [limit, setLimit] = useState(0);
  const [used, setUsed] = useState(0);
  const [settings, setSettings] = useState<MailSecuritySettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [scopeId, setScopeId] = useState("__all__");
  const [matchField, setMatchField] = useState<MailFilterMatchField>("SENDER");
  const [pattern, setPattern] = useState("");
  const [action, setAction] = useState<MailFilterAction>("SPAM");
  const [priority, setPriority] = useState("100");

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  useEffect(() => {
    setAction(defaultAction(tab));
    if (tab === "allowlist") setMatchField("SENDER");
  }, [tab]);

  const load = useCallback(async (id: string, activeTab: SecurityTab) => {
    setLoading(true);
    try {
      const ruleType = ruleTypeForTab(activeTab);
      const [result, boxes, security] = await Promise.all([
        activeTab === "settings"
          ? listMailFilterRules(id)
          : listMailFilterRules(id, ruleType),
        listMailMailboxes(id),
        getMailSecuritySettings(id),
      ]);
      setRules(
        activeTab === "settings"
          ? result.rules
          : result.rules.filter((rule) => rule.ruleType === ruleType),
      );
      setMailboxes(boxes.filter((box) => box.status === "ACTIVE"));
      setLimit(result.limit);
      setUsed(result.used);
      setSettings(security);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load security settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId, tab);
  }, [appId, tab, load]);

  const scopeOptions = useMemo(
    () => [
      { id: "__all__", label: "All mailboxes" },
      ...mailboxes.map((box) => ({ id: box.id, label: box.address })),
    ],
    [mailboxes],
  );

  const needsPlan = limit <= 0;
  const atLimit = !needsPlan && used >= limit;
  const canCreate =
    pattern.trim().length > 0 && !atLimit && !needsPlan && !saving && tab !== "settings";

  async function onCreate() {
    if (!appId || !canCreate || tab === "settings") return;
    const ruleType = ruleTypeForTab(tab);
    if (!ruleType) return;

    setSaving(true);
    try {
      const created = await createMailFilterRule(appId, {
        mailboxId: scopeId === "__all__" ? undefined : scopeId,
        ruleType,
        matchField,
        pattern: pattern.trim(),
        action,
        priority: Number(priority) || 100,
      });
      setRules((rows) => [created, ...rows]);
      setUsed((count) => count + 1);
      setPattern("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create rule.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(rule: MailFilterRuleView, enabled: boolean) {
    if (!appId) return;
    setBusyId(rule.id);
    try {
      const updated = await updateMailFilterRule(appId, rule.id, { enabled });
      setRules((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update rule.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(rule: MailFilterRuleView) {
    if (!appId) return;
    if (!window.confirm(`Delete this ${rule.ruleType.toLowerCase()} rule?`)) return;
    setBusyId(rule.id);
    try {
      await deleteMailFilterRule(appId, rule.id);
      setRules((rows) => rows.filter((row) => row.id !== rule.id));
      setUsed((count) => Math.max(0, count - 1));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete rule.");
    } finally {
      setBusyId(null);
    }
  }

  async function onSaveSettings(patch: Partial<MailSecuritySettingsView>) {
    if (!appId || !settings) return;
    setSaving(true);
    try {
      const next = await updateMailSecuritySettings(appId, patch);
      setSettings(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Security
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Blocklist, allowlist, and filter rules across all mailboxes in this workspace.
          </p>
        </div>
        {loading || tab === "settings" ? null : (
          <Chip color={needsPlan || atLimit ? "warning" : "default"} size="sm" variant="soft">
            {needsPlan ? "Plan required" : `${used} / ${limit}`}
          </Chip>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              tab === item.id
                ? "bg-[var(--foreground)] text-[var(--background)]"
                : "bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <MailNotice
          status="danger"
          title="Something went wrong"
          description={error}
          onDismiss={() => setError("")}
        />
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : tab === "settings" ? (
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Switch
            isSelected={settings?.quarantineSuspicious ?? true}
            isDisabled={saving}
            className="w-full justify-between"
            onChange={(next) => void onSaveSettings({ quarantineSuspicious: next })}
          >
            <Switch.Content>
              <Label>Quarantine suspicious mail</Label>
              <Description>
                Hold gray-area SES verdicts and partial authentication failures for admin review.
              </Description>
            </Switch.Content>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
          <Switch
            isSelected={settings?.notifyOnQuarantine ?? false}
            isDisabled={saving}
            className="w-full justify-between"
            onChange={(next) => void onSaveSettings({ notifyOnQuarantine: next })}
          >
            <Switch.Content>
              <Label>Notify on quarantine</Label>
              <Description>
                Send a notification when new mail is held for review.
              </Description>
            </Switch.Content>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
          <TextField
            fullWidth
            className="gap-1.5"
            value={String(settings?.quarantineRetentionDays ?? 30)}
            onChange={(value) => {
              const days = Number(value);
              if (!Number.isFinite(days)) return;
              void onSaveSettings({ quarantineRetentionDays: days });
            }}
            isDisabled={saving}
          >
            <Label className="text-sm font-medium">Quarantine retention (days)</Label>
            <Input type="number" inputMode="numeric" min={0} max={365} />
            <Description>
              Auto-delete held mail after this many days. Use 0 to keep messages indefinitely.
            </Description>
          </TextField>
          <Switch
            isSelected={settings?.quarantineNewSendersWithoutDmarc ?? false}
            isDisabled={saving}
            className="w-full justify-between"
            onChange={(next) =>
              void onSaveSettings({ quarantineNewSendersWithoutDmarc: next })
            }
          >
            <Switch.Content>
              <Label>Strict DMARC check</Label>
              <Description>
                Off by default. When enabled, also quarantine senders with missing DMARC
                if SPF or DKIM fails.
              </Description>
            </Switch.Content>
            <Switch.Control><Switch.Thumb /></Switch.Control>
          </Switch>
        </div>
      ) : (
        <>
          {needsPlan ? (
            <MailNotice
              status="warning"
              title="Plan required"
              description="This workspace needs an active plan before you can add filter rules."
            />
          ) : atLimit ? (
            <MailNotice
              status="warning"
              title="Rule limit reached"
              description={`This plan includes ${limit} filter rules. Remove one or upgrade for more.`}
            />
          ) : null}

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Applies to</Label>
                <ScopeDropdown
                  value={scopeId}
                  options={scopeOptions}
                  disabled={saving || atLimit || needsPlan}
                  onChange={setScopeId}
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Match</Label>
                <SelectDropdown
                  label="Match field"
                  value={matchField}
                  options={MATCH_FIELDS}
                  disabled={saving || atLimit || needsPlan}
                  onChange={setMatchField}
                />
              </div>
            </div>

            <TextField
              isRequired
              fullWidth
              className="gap-1.5"
              value={pattern}
              onChange={setPattern}
              isDisabled={saving || atLimit || needsPlan}
            >
              <Label className="text-sm font-medium">Pattern</Label>
              <Input
                placeholder={
                  matchField === "SUBJECT"
                    ? "invoice overdue"
                    : matchField === "DOMAIN"
                      ? "example.com"
                      : "sender@example.com"
                }
                autoComplete="off"
                dir="ltr"
              />
            </TextField>

            {tab !== "allowlist" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Action</Label>
                  <SelectDropdown
                    label="Action"
                    value={action}
                    options={actionOptions(tab)}
                    disabled={saving || atLimit || needsPlan}
                    onChange={setAction}
                  />
                </div>
                {tab === "filters" ? (
                  <TextField
                    fullWidth
                    className="gap-1.5"
                    value={priority}
                    onChange={setPriority}
                    isDisabled={saving || atLimit || needsPlan}
                  >
                    <Label className="text-sm font-medium">Priority</Label>
                    <Input type="number" inputMode="numeric" />
                    <Description>Lower numbers run first.</Description>
                  </TextField>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button size="sm" isDisabled={!canCreate} onPress={() => void onCreate()}>
                {saving ? "Adding…" : "Add rule"}
              </Button>
            </div>
          </div>

          {rules.length === 0 ? (
            <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-10">
              <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                <Shield className="size-5" aria-hidden />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">No rules yet</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Add a rule to control how inbound mail is handled.
              </p>
            </EmptyState>
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 sm:flex-row sm:items-center md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]" dir="ltr">
                      {rule.pattern}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {matchFieldLabel(rule.matchField)} · {actionLabel(rule.action)}
                      {rule.mailboxAddress ? ` · ${rule.mailboxAddress}` : " · All mailboxes"}
                      {rule.ruleType === "FILTER" ? ` · Priority ${rule.priority}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={rule.enabled}
                      isDisabled={busyId === rule.id}
                      onChange={(next) => void onToggle(rule, next)}
                    >
                      <Switch.Content><Label className="text-xs">On</Label></Switch.Content>
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label="Delete rule"
                      isDisabled={busyId === rule.id}
                      onPress={() => void onDelete(rule)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
