"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";
import type { MailTeamRole } from "@/lib/mail-team-client";
import type {
  MailSsoMailbox,
  MailSsoProvisionInput,
  MailSsoProvisionResult,
} from "@/lib/mail-sso-client";
import {
  MAIL_SSO_ROLE_OPTIONS,
  MailSsoSelect,
  copyToClipboard,
} from "@/components/app/sso/mail-sso-select";

const NO_MAILBOX = "__none__";
const NEW_MAILBOX = "__new__";

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function MailSsoAddCard({
  mailboxes,
  primaryDomain,
  domainActive,
  disabled,
  onSubmit,
}: {
  mailboxes: MailSsoMailbox[];
  primaryDomain: string | null;
  domainActive: boolean;
  disabled: boolean;
  onSubmit: (input: MailSsoProvisionInput) => Promise<MailSsoProvisionResult | null>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MailTeamRole>("MEMBER");
  const [mailboxChoice, setMailboxChoice] = useState<string>(NO_MAILBOX);
  const [localPart, setLocalPart] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastLink, setLastLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const mailboxOptions = useMemo(
    () => [
      { value: NO_MAILBOX, label: "No mailbox", hint: "Console access only" },
      ...(domainActive
        ? [
            {
              value: NEW_MAILBOX,
              label: "Create new address…",
              hint: primaryDomain ? `name@${primaryDomain}` : undefined,
            },
          ]
        : []),
      ...mailboxes.map((box) => ({
        value: box.id,
        label: box.address,
        hint: box.pendingAssigneeEmail
          ? `Reserved for ${box.pendingAssigneeEmail}`
          : box.assignedUserId
            ? "Assigned · will be reassigned"
            : "Unassigned",
      })),
    ],
    [domainActive, mailboxes, primaryDomain],
  );

  const emailValid = looksLikeEmail(email);
  const needsLocalPart = mailboxChoice === NEW_MAILBOX;
  const canSubmit =
    !disabled && !busy && emailValid && (!needsLocalPart || localPart.trim().length > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setCopied(false);
    const result = await onSubmit({
      email: email.trim().toLowerCase(),
      role,
      ...(mailboxChoice === NEW_MAILBOX
        ? { newLocalPart: localPart.trim().toLowerCase() }
        : mailboxChoice !== NO_MAILBOX
          ? { mailboxId: mailboxChoice }
          : {}),
    });
    setBusy(false);
    if (result) {
      setLastLink({ email: result.email, url: result.link.url });
      setEmail("");
      setLocalPart("");
      setMailboxChoice(NO_MAILBOX);
      setRole("MEMBER");
    }
  }

  return (
    <div className="rounded-2xl bg-[var(--surface)] px-4 py-5 md:px-6 md:py-6">
      <div className="mb-4 min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          Add teammate &amp; assign mailbox
        </h2>
        <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
          One step: invite, reserve a mailbox and email a sign-in link. Works
          for new emails too — they create their Rukny account from the link.
        </p>
      </div>

      <form
        className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.4fr)_9.5rem_minmax(0,1.2fr)_auto] lg:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          isRequired
          fullWidth
          className="min-w-0 gap-1.5"
          type="email"
          value={email}
          onChange={setEmail}
          isDisabled={disabled}
          isInvalid={email.length > 0 && !emailValid}
        >
          <Label className="text-[13px] font-medium text-[var(--foreground)]">Email</Label>
          <Input
            dir="ltr"
            placeholder="teammate@company.com"
            autoComplete="off"
            className="h-11 rounded-xl"
          />
        </TextField>

        <div className="min-w-0">
          <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
            Role
          </Label>
          <MailSsoSelect
            label="Role"
            value={role}
            options={MAIL_SSO_ROLE_OPTIONS}
            disabled={disabled}
            onChange={setRole}
          />
        </div>

        <div className="min-w-0">
          <Label className="mb-1.5 block text-[13px] font-medium text-[var(--foreground)]">
            Mailbox
          </Label>
          <MailSsoSelect
            label="Mailbox"
            value={mailboxChoice}
            options={mailboxOptions}
            disabled={disabled}
            onChange={setMailboxChoice}
          />
        </div>

        <Button
          type="submit"
          className="h-11 shrink-0 rounded-full px-5"
          isDisabled={!canSubmit}
        >
          {busy ? "Sending…" : "Send link"}
        </Button>

        {needsLocalPart ? (
          <TextField
            fullWidth
            className="min-w-0 gap-1.5 lg:col-span-2"
            value={localPart}
            onChange={setLocalPart}
            isDisabled={disabled}
          >
            <Label className="text-[13px] font-medium text-[var(--foreground)]">
              New address
            </Label>
            <div className="flex min-w-0 items-center gap-2" dir="ltr">
              <Input placeholder="sara" className="h-11 min-w-0 flex-1 rounded-xl" />
              <span className="shrink-0 text-sm text-[var(--muted-foreground)]">
                @{primaryDomain}
              </span>
            </div>
          </TextField>
        ) : null}
      </form>

      {lastLink ? (
        <div className="mt-4 flex min-w-0 flex-col gap-2 rounded-xl bg-[var(--surface-secondary)] px-3.5 py-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 text-[13px] text-[var(--muted-foreground)]">
            Link emailed to{" "}
            <span className="font-medium text-[var(--foreground)]" dir="ltr">
              {lastLink.email}
            </span>
            . You can also share it directly — it only works for that email.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 rounded-full"
            onPress={async () => setCopied(await copyToClipboard(lastLink.url))}
          >
            <Copy className="size-3.5" aria-hidden />
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
