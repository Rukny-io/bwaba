"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { Check } from "lucide-react";
import { DnsRecordsTable } from "@/components/app/dns-records-table";
import { applyDnsCheckResults, type MailDomainSetup } from "@/lib/mail-domain";
import { writeMailDomainSetup } from "@/lib/mail-domain-storage";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import { deleteDomainRequest, verifyDomainRequest } from "@/lib/verify-domain-client";

function Pill({
  children,
  onPress,
  tone = "ghost",
}: {
  children: ReactNode;
  onPress: () => void;
  tone?: "solid" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold tracking-tight transition-colors",
        tone === "solid"
          ? "bg-[var(--foreground)] text-[var(--background)]"
          : "text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]",
      )}
    >
      {children}
    </button>
  );
}

export function MailDomainDashboard({ setup: initial }: { setup: MailDomainSetup }) {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [setup, setSetup] = useState(initial);
  const [checking, setChecking] = useState(false);
  const verified = setup.status === "ACTIVE";

  function persist(next: MailDomainSetup) {
    setSetup(next);
    writeMailDomainSetup(next);
  }

  async function disconnect() {
    try {
      await deleteDomainRequest(setup.domain);
    } catch {
      // still leave the local identity if the provider call fails
    }
    writeMailDomainSetup(null);
    window.location.assign(href("/app"));
  }

  async function recheck() {
    setChecking(true);
    persist({
      ...setup,
      status: "VERIFYING",
      records: setup.records.map((record) => ({ ...record, status: "checking" })),
    });
    try {
      const result = await verifyDomainRequest(setup.domain, setup.dkimTokens ?? []);
      persist(applyDnsCheckResults(setup, result.results, result.verified, result.waiting));
    } catch {
      persist({
        ...setup,
        status: "FAILED",
        records: setup.records.map((record) => ({ ...record, status: "failed" })),
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">Domain settings</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="sr-only">{setup.domain}</h1>
            <span className="inline-flex h-10 max-w-full items-center gap-2 rounded-full bg-[var(--foreground)] py-1 pr-1.5 pl-4">
              <span className="truncate text-[15px] font-semibold text-[var(--background)]">
                {setup.domain}
              </span>
              {verified ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white">
                  <Check className="size-3.5 text-[var(--primary)]" strokeWidth={3} aria-hidden />
                </span>
              ) : null}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {verified
              ? "DNS records for this domain. Manage mailboxes from App."
              : setup.status === "PENDING_DNS"
                ? "DNS is live. Sending confirmation is still pending."
                : "Some DNS records are missing or still updating."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href("/app")}
            className="inline-flex h-9 items-center rounded-full px-3 text-[12px] font-medium text-[var(--muted-foreground)] hover:bg-[rgba(15,23,42,0.06)] hover:text-[var(--foreground)]"
          >
            Mailboxes
          </Link>
          <div className="inline-flex items-center gap-0.5 rounded-full border border-[color-mix(in_srgb,var(--foreground)_10%,var(--border))] bg-[var(--surface)]/90 p-1 shadow-[0_10px_36px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-1.5">
            <Pill onPress={() => void disconnect()}>Remove domain</Pill>
          </div>
        </div>
      </div>

      <DnsRecordsTable
        domain={setup.domain}
        records={setup.records}
        showStatus
        layout="board"
        checking={checking}
        onCheck={() => void recheck()}
      />
    </section>
  );
}
