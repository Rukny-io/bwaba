"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseDate, type DateValue } from "@internationalized/date";
import { ChevronDown, ReplyAll } from "lucide-react";
import {
  Alert,
  Button,
  Calendar,
  Chip,
  DateField,
  DatePicker,
  Description,
  Dropdown,
  EmptyState,
  FieldError,
  Input,
  Label,
  Skeleton,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  listMailAutoReplies,
  saveMailAutoReply,
  type MailAutoReplyView,
} from "@/lib/mail-auto-reply-client";

function toDateValue(iso: string | null): DateValue | null {
  if (!iso) return null;
  try {
    return parseDate(iso.slice(0, 10));
  } catch {
    return null;
  }
}

function dateToIso(value: DateValue | null) {
  return value ? value.toString() : "";
}

function CalendarContent({ label }: { label: string }) {
  return (
    <Calendar aria-label={label}>
      <Calendar.Header>
        <Calendar.YearPickerTrigger>
          <Calendar.YearPickerTriggerHeading />
          <Calendar.YearPickerTriggerIndicator />
        </Calendar.YearPickerTrigger>
        <Calendar.NavButton slot="previous" />
        <Calendar.NavButton slot="next" />
      </Calendar.Header>
      <Calendar.Grid>
        <Calendar.GridHeader>
          {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
        </Calendar.GridHeader>
        <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
      </Calendar.Grid>
      <Calendar.YearPickerGrid>
        <Calendar.YearPickerGridBody>
          {({ year }) => <Calendar.YearPickerCell year={year} />}
        </Calendar.YearPickerGridBody>
      </Calendar.YearPickerGrid>
    </Calendar>
  );
}

function OptionalDatePicker({
  name,
  label,
  description,
  value,
  onChange,
  isDisabled,
  isInvalid,
}: {
  name: string;
  label: string;
  description: string;
  value: DateValue | null;
  onChange: (value: DateValue | null) => void;
  isDisabled?: boolean;
  isInvalid?: boolean;
}) {
  return (
    <DatePicker
      className="w-full min-w-0"
      name={name}
      value={value}
      onChange={(next) => onChange(next ?? null)}
      isDisabled={isDisabled}
      isInvalid={isInvalid}
    >
      <Label className="text-sm font-medium text-[var(--foreground)]">{label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {isInvalid ? (
        <FieldError>End date must be on or after the start date.</FieldError>
      ) : (
        <Description>{description}</Description>
      )}
      <DatePicker.Popover>
        <CalendarContent label={label} />
      </DatePicker.Popover>
    </DatePicker>
  );
}

function emptyReply(mailboxId: string, mailboxAddress: string): MailAutoReplyView {
  return {
    mailboxId,
    mailboxAddress,
    enabled: false,
    subject: "",
    bodyText: "",
    startsAt: null,
    endsAt: null,
    updatedAt: null,
  };
}

function windowLabel(reply: {
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  allowed: boolean;
}) {
  if (!reply.enabled) return { text: "Off", color: "default" as const };
  if (!reply.allowed) return { text: "Won't send", color: "warning" as const };
  const now = Date.now();
  if (reply.startsAt && new Date(reply.startsAt).getTime() > now) {
    return { text: "Scheduled", color: "warning" as const };
  }
  if (reply.endsAt && new Date(reply.endsAt).getTime() < now) {
    return { text: "Ended", color: "default" as const };
  }
  return { text: "On", color: "success" as const };
}

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
        aria-label="Mailbox"
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

export function MailAutoReplyPage() {
  const pathname = usePathname();
  const router = useRouter();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [appId, setAppId] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [replies, setReplies] = useState<MailAutoReplyView[]>([]);
  const [mailboxId, setMailboxId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [startsAt, setStartsAt] = useState<DateValue | null>(null);
  const [endsAt, setEndsAt] = useState<DateValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = readMailAppIdFromDocument();
    if (!id) {
      window.location.assign("/apps?error=app_required");
      return;
    }
    setAppId(id);
  }, []);

  const applyReply = useCallback((reply: MailAutoReplyView) => {
    setMailboxId(reply.mailboxId);
    setEnabled(reply.enabled);
    setSubject(reply.subject);
    setBodyText(reply.bodyText);
    setStartsAt(toDateValue(reply.startsAt));
    setEndsAt(toDateValue(reply.endsAt));
  }, []);

  const load = useCallback(
    async (id: string, keepMailboxId?: string) => {
      setLoading(true);
      try {
        const result = await listMailAutoReplies(id);
        setAllowed(result.allowed);
        setReplies(result.replies);
        const current =
          result.replies.find((row) => row.mailboxId === keepMailboxId) ||
          result.replies[0] ||
          null;
        if (current) applyReply(current);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load automatic replies.",
        );
      } finally {
        setLoading(false);
      }
    },
    [applyReply],
  );

  useEffect(() => {
    if (!appId) return;
    void load(appId);
  }, [appId, load]);

  const currentSaved = useMemo(
    () => replies.find((row) => row.mailboxId === mailboxId) ?? null,
    [replies, mailboxId],
  );

  const dirty = useMemo(() => {
    const saved = currentSaved ?? emptyReply(mailboxId, "");
    return (
      enabled !== saved.enabled ||
      subject !== saved.subject ||
      bodyText !== saved.bodyText ||
      dateToIso(startsAt) !== (saved.startsAt ? saved.startsAt.slice(0, 10) : "") ||
      dateToIso(endsAt) !== (saved.endsAt ? saved.endsAt.slice(0, 10) : "")
    );
  }, [currentSaved, enabled, subject, bodyText, startsAt, endsAt, mailboxId]);

  const mailboxOptions = useMemo(
    () => replies.map((row) => ({ id: row.mailboxId, label: row.mailboxAddress })),
    [replies],
  );

  const rangeInvalid = Boolean(
    startsAt && endsAt && endsAt.compare(startsAt) < 0,
  );

  const status = windowLabel({
    enabled,
    startsAt: startsAt ? `${dateToIso(startsAt)}T00:00:00.000Z` : null,
    endsAt: endsAt ? `${dateToIso(endsAt)}T23:59:59.999Z` : null,
    allowed,
  });

  function selectMailbox(nextId: string) {
    const next = replies.find((row) => row.mailboxId === nextId);
    if (next) applyReply(next);
  }

  async function persist() {
    if (!appId || !mailboxId) return;
    if (enabled && !allowed) {
      setError("Automatic replies require a Standard or Premium plan.");
      return;
    }
    if (enabled && (!subject.trim() || !bodyText.trim())) {
      setError("Add a subject and message before turning automatic replies on.");
      return;
    }
    if (rangeInvalid) {
      setError("End date must be on or after the start date.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveMailAutoReply(appId, mailboxId, {
        enabled,
        subject: subject.trim(),
        bodyText: bodyText.trim(),
        startsAt: dateToIso(startsAt) || null,
        endsAt: dateToIso(endsAt) || null,
      });
      setAllowed(result.allowed);
      setReplies((rows) =>
        rows.map((row) =>
          row.mailboxId === result.reply.mailboxId ? result.reply : row,
        ),
      );
      applyReply(result.reply);
      setError("");
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save automatic reply.",
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
            Automatic Reply
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Send an out-of-office reply from a mailbox. Each sender is answered at most once per day.
          </p>
        </div>
        {loading ? null : (
          <Chip color={status.color} size="sm" variant="soft">
            {status.text}
          </Chip>
        )}
      </div>

      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Automatic Reply</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {!loading && !allowed ? (
        <Alert status="warning" className="items-center">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Standard or Premium</Alert.Title>
            <Alert.Description>
              You can save a draft, but automatic replies send only on Standard or Premium.
            </Alert.Description>
          </Alert.Content>
          <Button size="sm" onPress={() => router.push("/pricing")}>
            Upgrade
          </Button>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : replies.length === 0 ? (
        <EmptyState className="rounded-2xl bg-[var(--surface)] px-5 py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <ReplyAll className="size-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
            Create a mailbox first
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Automatic replies are set per mailbox.
          </p>
          <Button size="sm" className="mt-4" onPress={() => router.push(href("/app"))}>
            Go to mailboxes
          </Button>
        </EmptyState>
      ) : (
        <div className="flex min-w-0 flex-col gap-5 rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <Label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Mailbox
            </Label>
            <MailboxDropdown
              value={mailboxId}
              options={mailboxOptions}
              disabled={saving}
              onChange={selectMailbox}
            />
          </div>

          <Switch
            isSelected={enabled}
            isDisabled={saving || (!allowed && !enabled)}
            className="w-full justify-between"
            onChange={setEnabled}
          >
            <Switch.Content>
              <Label>Enable automatic reply</Label>
              <Description>
                Replies go out after new mail arrives. They are not stored in Sent.
              </Description>
            </Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>

          <TextField
            isRequired={enabled}
            fullWidth
            className="gap-1.5"
            value={subject}
            onChange={setSubject}
            isDisabled={saving}
            maxLength={200}
          >
            <Label className="text-sm font-medium text-[var(--foreground)]">
              Subject
            </Label>
            <Input placeholder="Out of office" />
          </TextField>

          <TextField
            isRequired={enabled}
            fullWidth
            className="gap-1.5"
            value={bodyText}
            onChange={setBodyText}
            isDisabled={saving}
            maxLength={10000}
          >
            <Label className="text-sm font-medium text-[var(--foreground)]">
              Message
            </Label>
            <TextArea
              rows={6}
              className="min-h-32"
              placeholder="Thank you for your email. I am away and will reply when I return."
            />
          </TextField>

          <div className="grid gap-3 sm:grid-cols-2">
            <OptionalDatePicker
              name="startsAt"
              label="Start date"
              description="Optional. Leave empty to start immediately."
              value={startsAt}
              onChange={setStartsAt}
              isDisabled={saving}
            />
            <OptionalDatePicker
              name="endsAt"
              label="End date"
              description="Optional. Leave empty to keep it on."
              value={endsAt}
              onChange={setEndsAt}
              isDisabled={saving}
              isInvalid={rangeInvalid}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="sm"
              isDisabled={saving || !dirty}
              onPress={() => void persist()}
            >
              {saving ? "Saving…" : savedFlash ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
