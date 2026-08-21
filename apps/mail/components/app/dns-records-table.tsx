"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { cn } from "@heroui/react";
import type { MailDnsRecord } from "@/lib/mail-domain";
import { recordsAsZoneFile } from "@/lib/mail-domain";

function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const COLUMNS = "grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1.45fr)]";

function groupedRecords(records: MailDnsRecord[]) {
  const mx = records.filter((record) => record.type === "MX");
  const dkim = records.filter((record) => record.purpose === "DKIM");
  const txt = records.filter((record) => record.type === "TXT");
  const otherCname = records.filter(
    (record) => record.type === "CNAME" && record.purpose !== "DKIM",
  );

  return [
    { title: "MX", records: mx },
    { title: "DKIM", records: dkim },
    { title: "CNAME", records: otherCname },
    { title: "TXT", records: txt },
  ].filter((group) => group.records.length > 0);
}

function groupStatus(records: MailDnsRecord[]): MailDnsRecord["status"] {
  if (records.every((record) => record.status === "verified")) return "verified";
  if (records.some((record) => record.status === "failed")) return "failed";
  if (records.some((record) => record.status === "checking")) return "checking";
  return "pending";
}

function statusDot(status: MailDnsRecord["status"]) {
  if (status === "verified") return "bg-[var(--success)]";
  if (status === "failed") return "bg-[var(--danger)]";
  if (status === "checking") return "bg-[var(--primary)]";
  return "bg-[var(--muted-foreground)]/35";
}

function CopyCell({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex min-h-9 min-w-0 items-center gap-1.5">
      <span
        className="min-w-0 flex-1 break-all font-mono text-xs leading-5 text-[var(--foreground)]"
        title={value}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
        aria-label="Copy"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

export function DnsRecordsTable({
  records,
  domain,
  showStatus = false,
  layout = "list",
  checking = false,
  onCheck,
}: {
  records: MailDnsRecord[];
  domain: string;
  showStatus?: boolean;
  layout?: "list" | "board";
  checking?: boolean;
  onCheck?: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const large = layout === "board";

  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1200);
  }

  return (
    <div className={cn("flex flex-col gap-4", large && "pb-2")}>
      <div className="flex h-8 shrink-0 items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">DNS</h2>
        <div className="flex items-center gap-0.5 text-[13px] font-medium text-[var(--muted-foreground)]">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
            onClick={() =>
              downloadFile(`${domain}-dns.txt`, recordsAsZoneFile(domain, records), "text/plain")
            }
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-full px-3 hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
            onClick={() => void copy("bind", recordsAsZoneFile(domain, records))}
          >
            {copied === "bind" ? "Copied" : "Copy"}
          </button>
          {onCheck ? (
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-full px-3 hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
              disabled={checking}
              onClick={onCheck}
            >
              {checking ? "Checking" : "Check"}
            </button>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-3">
        {groupedRecords(records).map((group) => (
          <li
            key={group.title}
            className="flex flex-col rounded-2xl bg-[var(--surface)] px-5 py-4"
          >
            <div className="mb-2 flex h-5 shrink-0 items-center gap-2">
              {showStatus ? (
                <span className={cn("size-1.5 rounded-full", statusDot(groupStatus(group.records)))} />
              ) : null}
              <span className="text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
                {group.title}
              </span>
              <span className="text-[12px] tabular-nums text-[var(--muted-foreground)]">
                {group.records.length}
              </span>
            </div>

            <div className={cn("grid content-start", COLUMNS, "gap-x-4")}>
              <span className="pb-1.5 text-[11px] font-medium tracking-wide text-[var(--muted-foreground)]">
                Pri
              </span>
              <span className="pb-1.5 text-[11px] font-medium tracking-wide text-[var(--muted-foreground)]">
                Host
              </span>
              <span className="pb-1.5 text-[11px] font-medium tracking-wide text-[var(--muted-foreground)]">
                Value
              </span>

              {group.records.map((record) => (
                <div key={record.id} className="contents">
                  <span className="flex min-h-9 items-center border-t border-[var(--border)]/50 text-[12px] tabular-nums text-[var(--muted-foreground)]">
                    {record.priority ?? "—"}
                  </span>
                  <div className="min-w-0 border-t border-[var(--border)]/50">
                    <CopyCell
                      value={record.host}
                      copied={copied === `${record.id}-name`}
                      onCopy={() => void copy(`${record.id}-name`, record.host)}
                    />
                  </div>
                  <div className="min-w-0 border-t border-[var(--border)]/50">
                    <CopyCell
                      value={record.value}
                      copied={copied === `${record.id}-value`}
                      onCopy={() => void copy(`${record.id}-value`, record.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
