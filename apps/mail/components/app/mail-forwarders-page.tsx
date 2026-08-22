"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Forward, Trash2 } from "lucide-react";
import {
  Alert,
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
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  createMailForwarder,
  deleteMailForwarder,
  listMailForwarders,
  updateMailForwarder,
  type MailForwarderView,
} from "@/lib/mail-forwarder-client";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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

export function MailForwardersPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [limit, setLimit] = useState(0);
  const [forwarders, setForwarders] = useState<MailForwarderView[]>([]);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [toAddress, setToAddress] = useState("");
  const [mailboxId, setMailboxId] = useState("");
  const [keepCopy, setKeepCopy] = useState(true);
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
        listMailForwarders(id),
        listMailMailboxes(id),
      ]);
      const active = boxes.filter((box) => box.status === "ACTIVE");
      setMailboxes(active);
      setDomain(result.domain);
      setLimit(result.limit);
      setForwarders(result.forwarders);
      setMailboxId((current) => {
        if (current && active.some((box) => box.id === current)) return current;
        return active[0]?.id || "";
      });
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load forwarders.");
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

  const used = forwarders.length;
  const needsPlan = limit <= 0;
  const atLimit = !needsPlan && used >= limit;
  const destReady = looksLikeEmail(toAddress);
  const canCreate = Boolean(
    mailboxId && destReady && !atLimit && !needsPlan && !saving,
  );

  async function onCreate() {
    if (!appId || !canCreate) return;
    setSaving(true);
    try {
      const created = await createMailForwarder(appId, {
        mailboxId,
        toAddress: toAddress.trim().toLowerCase(),
        keepCopy,
      });
      setForwarders((rows) => [
        created,
        ...rows.filter((row) => row.id !== created.id),
      ]);
      setToAddress("");
      setKeepCopy(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create forwarder.");
    } finally {
      setSaving(false);
    }
  }

  async function onPatch(
    forwarder: MailForwarderView,
    input: { enabled?: boolean; keepCopy?: boolean; mailboxId?: string },
  ) {
    if (!appId) return;
    setBusyId(forwarder.id);
    try {
      const updated = await updateMailForwarder(appId, forwarder.id, input);
      setForwarders((rows) =>
        rows.map((row) => (row.id === updated.id ? updated : row)),
      );
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update forwarder.");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(forwarder: MailForwarderView) {
    if (!appId) return;
    if (
      !window.confirm(
        `Stop forwarding ${forwarder.mailboxAddress} to ${forwarder.toAddress}?`,
      )
    ) {
      return;
    }
    setBusyId(forwarder.id);
    try {
      await deleteMailForwarder(appId, forwarder.id);
      setForwarders((rows) => rows.filter((row) => row.id !== forwarder.id));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete forwarder.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Forwarders
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Send incoming mailbox mail to an external address. This is not an alias.
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
            <Alert.Title>Forwarders</Alert.Title>
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
            <Forward className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            Create a mailbox first
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Forwarders send mail from an active mailbox to an address outside this domain.
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
                  This Mail app needs an active plan before you can add forwarders.
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
                <Alert.Title>Forwarding limit reached</Alert.Title>
                <Alert.Description>
                  This plan includes {limit} forwarding rules. Remove one or upgrade for more.
                </Alert.Description>
              </Alert.Content>
              <Button size="sm" onPress={() => router.push("/pricing")}>
                Upgrade
              </Button>
            </Alert>
          ) : null}

          <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
            <div className="min-w-0">
              <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                From mailbox
              </Label>
              <MailboxDropdown
                label="Source mailbox"
                value={mailboxId}
                options={mailboxOptions}
                disabled={saving || atLimit || needsPlan}
                onChange={setMailboxId}
              />
            </div>

            <TextField
              isRequired
              type="email"
              fullWidth
              className="gap-1.5"
              value={toAddress}
              onChange={(value) => setToAddress(value.trim().toLowerCase())}
              isDisabled={saving || atLimit || needsPlan}
            >
              <Label className="text-sm font-medium text-[var(--foreground)]">
                Forward to
              </Label>
              <Input
                type="email"
                placeholder="person@example.com"
                autoComplete="off"
                dir="ltr"
              />
              <Description>
                {domain
                  ? `Use an address outside ${domain}. Aliases keep mail inside Rukny.`
                  : "Use an address outside this domain. Aliases keep mail inside Rukny."}
              </Description>
            </TextField>

            <Switch
              isSelected={keepCopy}
              isDisabled={saving || atLimit || needsPlan}
              className="w-full justify-between"
              onChange={setKeepCopy}
            >
              <Switch.Content>
                <Label>Keep a copy in the mailbox</Label>
                <Description>
                  Leave the original message in the inbox after it is forwarded.
                </Description>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>

            <div className="flex justify-end">
              <Button
                size="sm"
                isDisabled={!canCreate}
                onPress={() => void onCreate()}
              >
                {saving ? "Adding…" : "Add forwarder"}
              </Button>
            </div>
          </div>

          {forwarders.length === 0 ? (
            <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-10">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No forwarders yet
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Add a rule to send inbound mail to another inbox.
              </p>
            </EmptyState>
          ) : (
            <div className="flex min-w-0 flex-col gap-2">
              {forwarders.map((forwarder) => (
                <div
                  key={forwarder.id}
                  className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface)] p-4 sm:flex-row sm:items-center md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-medium text-[var(--foreground)]"
                      dir="ltr"
                    >
                      {forwarder.mailboxAddress}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]"
                      dir="ltr"
                    >
                      → {forwarder.toAddress}
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:max-w-[16rem] sm:flex-1">
                    <MailboxDropdown
                      label="Source mailbox"
                      value={
                        mailboxOptions.some((option) => option.id === forwarder.mailboxId)
                          ? forwarder.mailboxId
                          : ""
                      }
                      options={mailboxOptions}
                      disabled={busyId === forwarder.id}
                      onChange={(next) => void onPatch(forwarder, { mailboxId: next })}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <Switch
                      isSelected={forwarder.keepCopy}
                      isDisabled={busyId === forwarder.id}
                      onChange={(next) => void onPatch(forwarder, { keepCopy: next })}
                    >
                      <Switch.Content>
                        <Label className="text-xs">Copy</Label>
                      </Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    <Switch
                      isSelected={forwarder.enabled}
                      isDisabled={busyId === forwarder.id}
                      onChange={(next) => void onPatch(forwarder, { enabled: next })}
                    >
                      <Switch.Content>
                        <Label className="text-xs">On</Label>
                      </Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete forwarder to ${forwarder.toAddress}`}
                      isDisabled={busyId === forwarder.id}
                      onPress={() => void onDelete(forwarder)}
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
