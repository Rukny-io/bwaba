"use client";

import { useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button, Chip, Label, TextArea, TextField } from "@heroui/react";
import type { MailTeamRole } from "@/lib/mail-team-client";
import {
  parseMailSsoCsv,
  type MailSsoBulkResult,
  type MailSsoMailbox,
  type MailSsoProvisionInput,
} from "@/lib/mail-sso-client";

const MAX_ROWS = 100;
const ROLES: MailTeamRole[] = ["ADMIN", "BILLING", "MEMBER", "VIEWER"];
const LOCAL_PART_RE = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;

type PreviewRow = {
  line: number;
  email: string;
  mailboxLabel: string;
  role: MailTeamRole;
  input: MailSsoProvisionInput | null;
  error: string | null;
};

function resolveRows(
  text: string,
  mailboxes: MailSsoMailbox[],
  primaryDomain: string | null,
  domainActive: boolean,
): PreviewRow[] {
  const byAddress = new Map(mailboxes.map((box) => [box.address.toLowerCase(), box]));
  return parseMailSsoCsv(text).map((raw, index) => {
    const email = raw.email.toLowerCase();
    const roleRaw = raw.role.toUpperCase();
    const role = (ROLES as string[]).includes(roleRaw) ? (roleRaw as MailTeamRole) : "MEMBER";
    const base = { line: index + 1, email, role, mailboxLabel: "—" };

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ...base, input: null, error: "Invalid email" };
    }
    if (raw.role && !(ROLES as string[]).includes(roleRaw)) {
      return { ...base, input: null, error: `Unknown role "${raw.role}"` };
    }

    const mailboxRaw = raw.mailbox.toLowerCase();
    if (!mailboxRaw) {
      return { ...base, input: { email, role }, error: null };
    }

    const address = mailboxRaw.includes("@")
      ? mailboxRaw
      : primaryDomain
        ? `${mailboxRaw}@${primaryDomain.toLowerCase()}`
        : mailboxRaw;
    const existing = byAddress.get(address);
    if (existing) {
      return {
        ...base,
        mailboxLabel: existing.address,
        input: { email, role, mailboxId: existing.id },
        error: null,
      };
    }

    const [localPart, domain] = address.split("@");
    if (!domainActive || !primaryDomain || domain !== primaryDomain.toLowerCase()) {
      return { ...base, mailboxLabel: address, input: null, error: "Mailbox not found" };
    }
    if (!LOCAL_PART_RE.test(localPart)) {
      return { ...base, mailboxLabel: address, input: null, error: "Invalid address" };
    }
    return {
      ...base,
      mailboxLabel: `${address} (new)`,
      input: { email, role, newLocalPart: localPart },
      error: null,
    };
  });
}

export function MailSsoBulkCard({
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
  onSubmit: (rows: MailSsoProvisionInput[]) => Promise<MailSsoBulkResult | null>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<MailSsoBulkResult | null>(null);

  const rows = useMemo(
    () => resolveRows(text, mailboxes, primaryDomain, domainActive),
    [domainActive, mailboxes, primaryDomain, text],
  );
  const validRows = rows.filter((row) => row.input);
  const tooMany = rows.length > MAX_ROWS;
  const resultByEmail = useMemo(
    () => new Map((results?.results ?? []).map((r) => [r.email, r])),
    [results],
  );

  async function onFile(file: File | undefined) {
    if (!file) return;
    setText(await file.text());
    setResults(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (disabled || busy || tooMany || validRows.length === 0) return;
    setBusy(true);
    const result = await onSubmit(validRows.map((row) => row.input!));
    setBusy(false);
    if (result) setResults(result);
  }

  return (
    <div className="rounded-2xl bg-[var(--surface)] px-4 py-5 md:px-6 md:py-6">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            Bulk distribution
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
            Paste or upload a CSV with{" "}
            <code className="rounded bg-[var(--surface-secondary)] px-1" dir="ltr">
              email,mailbox,role
            </code>
            . Mailbox can be an existing address or a new name on your domain;
            role defaults to Member. Up to {MAX_ROWS} rows.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 rounded-full"
          isDisabled={disabled}
          onPress={() => fileRef.current?.click()}
        >
          <Upload className="size-3.5" aria-hidden />
          Upload CSV
        </Button>
      </div>

      <TextField
        fullWidth
        className="gap-1.5"
        value={text}
        onChange={(value) => {
          setText(value);
          setResults(null);
        }}
        isDisabled={disabled}
      >
        <Label className="text-[13px] font-medium text-[var(--foreground)]">Rows</Label>
        <TextArea
          dir="ltr"
          rows={5}
          className="min-h-28 font-mono text-[13px]"
          placeholder={`email,mailbox,role\nsara@company.com,sara,MEMBER\nali@company.com,support@${primaryDomain ?? "company.com"},VIEWER`}
        />
      </TextField>

      {rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
          <table className="w-full min-w-[34rem] border-collapse text-left text-[13px]" dir="ltr">
            <thead>
              <tr className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Mailbox</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color-mix(in_srgb,var(--foreground)_6%,transparent)]">
              {rows.slice(0, MAX_ROWS).map((row) => {
                const outcome = resultByEmail.get(row.email);
                return (
                  <tr key={`${row.line}-${row.email}`}>
                    <td className="px-3 py-2 tabular-nums text-[var(--muted-foreground)]">
                      {row.line}
                    </td>
                    <td className="px-3 py-2 text-[var(--foreground)]">{row.email || "—"}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">{row.mailboxLabel}</td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">{row.role}</td>
                    <td className="px-3 py-2">
                      {outcome ? (
                        outcome.ok ? (
                          <Chip size="sm" variant="soft" color="success">Sent</Chip>
                        ) : (
                          <span className="text-[var(--danger)]">{outcome.error}</span>
                        )
                      ) : row.error ? (
                        <span className="text-[var(--danger)]">{row.error}</span>
                      ) : (
                        <Chip size="sm" variant="soft">Ready</Chip>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-[var(--muted-foreground)]">
          {tooMany
            ? `Too many rows (${rows.length}). Split into batches of ${MAX_ROWS}.`
            : results
              ? `${results.succeeded} sent · ${results.failed} failed`
              : `${validRows.length} ready${rows.length > validRows.length ? ` · ${rows.length - validRows.length} need fixing` : ""}`}
        </p>
        <Button
          className="h-10 rounded-full px-5"
          isDisabled={disabled || busy || tooMany || validRows.length === 0}
          onPress={() => void submit()}
        >
          {busy ? "Sending…" : `Send ${validRows.length || ""} link${validRows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  );
}
