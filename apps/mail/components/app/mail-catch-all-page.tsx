"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Mails } from "lucide-react";
import {
  Alert,
  Button,
  Chip,
  Description,
  Dropdown,
  EmptyState,
  Label,
  Skeleton,
  Switch,
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  listMailMailboxes,
  type MailMailboxView,
} from "@/lib/mail-mailboxes-client";
import {
  getMailCatchAll,
  saveMailCatchAll,
  type MailCatchAllView,
} from "@/lib/mail-catch-all-client";

function MailboxDropdown({
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
    options.find((option) => option.id === value)?.label ?? "Select mailbox";

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label="Destination mailbox"
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

export function MailCatchAllPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [catchAll, setCatchAll] = useState<MailCatchAllView | null>(null);
  const [mailboxes, setMailboxes] = useState<MailMailboxView[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [mailboxId, setMailboxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const [settings, boxes] = await Promise.all([
        getMailCatchAll(id),
        listMailMailboxes(id),
      ]);
      const active = boxes.filter((box) => box.status === "ACTIVE");
      setMailboxes(active);
      setDomain(settings.domain);
      setCatchAll(settings.catchAll);
      setEnabled(Boolean(settings.catchAll?.enabled));
      setMailboxId(
        settings.catchAll?.mailboxId || active[0]?.id || "",
      );
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load catch-all settings.",
      );
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

  const selectedAddress =
    mailboxes.find((box) => box.id === mailboxId)?.address ||
    catchAll?.mailboxAddress ||
    null;

  async function persist(nextEnabled: boolean, nextMailboxId: string) {
    if (!appId) return;
    setSaving(true);
    try {
      const result = await saveMailCatchAll(appId, {
        enabled: nextEnabled,
        mailboxId: nextMailboxId || undefined,
      });
      setDomain(result.domain);
      setCatchAll(result.catchAll);
      setEnabled(Boolean(result.catchAll?.enabled));
      if (result.catchAll?.mailboxId) setMailboxId(result.catchAll.mailboxId);
      setError("");
    } catch (err) {
      setEnabled(Boolean(catchAll?.enabled));
      if (catchAll?.mailboxId) setMailboxId(catchAll.mailboxId);
      setError(
        err instanceof Error ? err.message : "Could not save catch-all settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Catch-all email
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Deliver mail sent to unknown addresses on your domain into one mailbox.
          </p>
        </div>
        {loading ? null : (
          <Chip
            color={enabled ? "success" : "default"}
            size="sm"
            variant="soft"
          >
            {enabled ? "On" : "Off"}
          </Chip>
        )}
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Catch-all</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ) : mailboxes.length === 0 ? (
        <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Mails className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            Create a mailbox first
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Catch-all needs an active mailbox to receive unmatched mail.
          </p>
          <Button size="sm" className="mt-4" onPress={() => router.push(href("/app"))}>
            Go to mailboxes
          </Button>
        </EmptyState>
      ) : (
        <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Switch
            isSelected={enabled}
            isDisabled={saving}
            className="w-full justify-between"
            onChange={(next) => {
              setEnabled(next);
              void persist(next, mailboxId);
            }}
          >
            <Switch.Content>
              <Label>Enable catch-all</Label>
              <Description>
                {domain
                  ? `Mail to addresses that are not a mailbox on ${domain} will be kept.`
                  : "Mail to unknown addresses on this domain will be kept."}
              </Description>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>

          <div className="min-w-0">
            <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Deliver unmatched mail to
            </Label>
            <MailboxDropdown
              value={mailboxId}
              options={mailboxOptions}
              disabled={saving}
              onChange={(next) => {
                setMailboxId(next);
                void persist(enabled, next);
              }}
            />
            {enabled && domain && selectedAddress ? (
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]" dir="ltr">
                *@{domain} → {selectedAddress}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
