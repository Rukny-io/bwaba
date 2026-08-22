"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AtSign, ChevronDown, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  Description,
  Dropdown,
  EmptyState,
  InputGroup,
  Label,
  Skeleton,
  Switch,
  TextField,
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  createMailAlias,
  deleteMailAlias,
  listMailAliases,
  updateMailAlias,
  type MailAliasView,
} from "@/lib/mail-alias-client";

function MailboxDropdown({
  value,
  options,
  onChange,
  disabled,
  label,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  label: string;
}) {
  const selectedLabel =
    options.find((option) => option.id === value)?.label ?? "Select mailbox";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={label}
        isDisabled={disabled}
        className="inline-flex h-9 w-full min-w-0 items-center justify-between gap-1.5 rounded-xl bg-[var(--field-background)] px-3 text-start text-sm font-medium text-[var(--foreground)] outline-none"
      >
        <span className="min-w-0 truncate" dir="ltr">
          {selectedLabel}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[var(--muted-foreground)]" />
      </Dropdown.Trigger>
      <Dropdown.Popover
        placement="bottom start"
        className="min-w-[16rem] overflow-hidden rounded-2xl"
      >
        <Dropdown.Menu
          selectedKeys={value ? new Set([value]) : new Set()}
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

export function MailAliasesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [limit, setLimit] = useState(0);
  const [aliases, setAliases] = useState<MailAliasView[]>([]);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [localPart, setLocalPart] = useState("");
  const [mailboxId, setMailboxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      const [result, boxes] = await Promise.all([
        listMailAliases(id),
        listMailMailboxes(id),
      ]);
      const active = boxes.filter((box) => box.status === "ACTIVE");
      setMailboxes(active);
      setDomain(result.domain);
      setLimit(result.limit);
      setAliases(result.aliases);
      setMailboxId((current) => {
        if (current && active.some((box) => box.id === current)) return current;
        return active[0]?.id || "";
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load aliases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  const mailboxOptions = useMemo(
    () => mailboxes.map((box) => ({ id: box.id, label: box.address })),
    [mailboxes],
  );

  const used = aliases.length;
  const needsPlan = limit <= 0;
  const atLimit = !needsPlan && used >= limit;
  const canCreate = Boolean(domain && mailboxId && !atLimit && !needsPlan && !saving);

  async function onCreate() {
    if (!appId || !canCreate) return;
    const name = localPart.trim().toLowerCase();
    if (!name) {
      setError("Enter an alias name.");
      return;
    }
    setSaving(true);
    try {
      const created = await createMailAlias(appId, {
        localPart: name,
        mailboxId,
      });
      setAliases((rows) => [created, ...rows.filter((row) => row.id !== created.id)]);
      setLocalPart("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create alias.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(alias: MailAliasView, enabled: boolean) {
    if (!appId) return;
    setBusyId(alias.id);
    try {
      const updated = await updateMailAlias(appId, alias.id, { enabled });
      setAliases((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row)),
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update alias.");
    } finally {
      setBusyId(null);
    }
  }

  async function onRetarget(alias: MailAliasView, nextMailboxId: string) {
    if (!appId || nextMailboxId === alias.mailboxId) return;
    setBusyId(alias.id);
    try {
      const updated = await updateMailAlias(appId, alias.id, {
        mailboxId: nextMailboxId,
      });
      setAliases((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row)),
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update alias.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(alias: MailAliasView) {
    if (!appId) return;
    if (!window.confirm(`Delete ${alias.address}?`)) return;
    setBusyId(alias.id);
    try {
      await deleteMailAlias(appId, alias.id);
      setAliases((rows) => rows.filter((row) => row.id !== alias.id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete alias.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Email Alias
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Extra addresses that deliver into a mailbox. They are not a separate inbox.
          </p>
        </div>
        {loading ? null : (
          <Chip
            color={needsPlan || atLimit ? "warning" : "default"}
            size="sm"
            variant="soft"
          >
            {needsPlan ? "Plan required" : `${used} / ${limit}`}
          </Chip>
        )}
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Email Alias</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : mailboxes.length === 0 ? (
        <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <AtSign className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            Create a mailbox first
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Aliases deliver into an active mailbox on this domain.
          </p>
          <Button size="sm" className="mt-4" onPress={() => router.push(href("/app"))}>
            Go to mailboxes
          </Button>
        </EmptyState>
      ) : (
        <>
          {needsPlan ? (
            <Alert status="warning" className="items-center">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Plan required</Alert.Title>
                <Alert.Description>
                  This Mail app needs an active plan before you can add aliases.
                </Alert.Description>
              </Alert.Content>
              <Button size="sm" onPress={() => router.push("/pricing")}>
                View plans
              </Button>
            </Alert>
          ) : atLimit ? (
            <Alert status="warning" className="items-center">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>Alias limit reached</Alert.Title>
                <Alert.Description>
                  This plan includes {limit} aliases. Remove one or upgrade for more.
                </Alert.Description>
              </Alert.Content>
              <Button size="sm" onPress={() => router.push("/pricing")}>
                Upgrade
              </Button>
            </Alert>
          ) : null}

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <TextField
              isRequired
              fullWidth
              className="gap-1.5"
              value={localPart}
              onChange={(value) => setLocalPart(value.toLowerCase())}
              isDisabled={saving || atLimit || needsPlan || !domain}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                New alias
              </Label>
              <InputGroup fullWidth>
                <InputGroup.Input placeholder="sales" autoComplete="off" />
                <InputGroup.Suffix>
                  <span dir="ltr">{domain ? `@${domain}` : "@domain"}</span>
                </InputGroup.Suffix>
              </InputGroup>
              <Description>
                Mail to this address is kept in the mailbox. Sending still uses the mailbox address.
              </Description>
            </TextField>

            <div className="min-w-0">
              <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Deliver to
              </Label>
              <MailboxDropdown
                label="Deliver to mailbox"
                value={mailboxId}
                options={mailboxOptions}
                disabled={saving || atLimit || needsPlan}
                onChange={setMailboxId}
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                isDisabled={!canCreate || !localPart.trim()}
                onPress={() => void onCreate()}
              >
                {saving ? "Adding…" : "Add alias"}
              </Button>
            </div>
          </div>

          {aliases.length === 0 ? (
            <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-10">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No aliases yet
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Add an address like sales@{domain || "your-domain"} to start.
              </p>
            </EmptyState>
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 sm:flex-row sm:items-center md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]" dir="ltr">
                      {alias.address}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
                      → {alias.mailboxAddress}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:max-w-[16rem] sm:flex-1">
                    <MailboxDropdown
                      label="Destination mailbox"
                      value={
                        mailboxOptions.some((option) => option.id === alias.mailboxId)
                          ? alias.mailboxId
                          : ""
                      }
                      options={mailboxOptions}
                      disabled={busyId === alias.id}
                      onChange={(next) => void onRetarget(alias, next)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Switch
                      isSelected={alias.enabled}
                      isDisabled={busyId === alias.id}
                      onChange={(next) => void onToggle(alias, next)}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${alias.address}`}
                      isDisabled={busyId === alias.id}
                      onPress={() => void onDelete(alias)}
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
