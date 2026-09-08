"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Chip, cn } from "@heroui/react";
import { Check } from "lucide-react";
import { DnsRecordsTable } from "@/components/app/dns-records-table";
import {
  buildBimiDnsRecord,
  applyDnsCheckResults,
  syncMailDomainRecords,
  type MailBimiSetupStatus,
  type MailDomainSetup,
} from "@/lib/mail-domain";
import { writeMailDomainSetup } from "@/lib/mail-domain-storage";
import { parseMailSlot, withMailSlot } from "@/lib/mail-slot";
import {
  deleteDomainRequest,
  verifyDomainRequest,
} from "@/lib/verify-domain-client";
import { fulfillPendingMailbox } from "@/lib/mail-pending-mailbox";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  getBimiSetupStatus,
  listDomainVerificationRequests,
  requestDomainVerification,
  uploadBimiLogo,
  type MailDomainVerificationRequest,
} from "@/lib/mail-domain-verification-client";
import { mailFeatureFlags } from "@/lib/mail-feature-flags";

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

export function MailDomainDashboard({
  setup: initial,
}: {
  setup: MailDomainSetup;
}) {
  const pathname = usePathname();
  const slot = parseMailSlot(pathname);
  const href = (path: string) => withMailSlot(path, slot);

  const [setup, setSetup] = useState(() => syncMailDomainRecords(initial));
  const [checking, setChecking] = useState(false);
  const [trustRequest, setTrustRequest] =
    useState<MailDomainVerificationRequest | null>(null);
  const [trustLoading, setTrustLoading] = useState(
    mailFeatureFlags.ruknyVerification,
  );
  const [trustError, setTrustError] = useState("");
  const [bimi, setBimi] = useState<MailBimiSetupStatus | null>(null);
  const [bimiLoading, setBimiLoading] = useState(mailFeatureFlags.outboundBimi);
  const [bimiError, setBimiError] = useState("");
  const verified = setup.status === "ACTIVE";

  useEffect(() => {
    const synced = syncMailDomainRecords(initial);
    // The dashboard intentionally mirrors externally refreshed setup state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSetup(synced);
    writeMailDomainSetup(synced);
  }, [initial]);

  useEffect(() => {
    if (!mailFeatureFlags.ruknyVerification) return;
    const appId = readMailAppIdFromDocument();
    if (!appId) return;
    let cancelled = false;
    void listDomainVerificationRequests(appId)
      .then(({ requests }) => {
        if (!cancelled) setTrustRequest(requests[0] ?? null);
      })
      .catch((error) => {
        if (!cancelled)
          setTrustError(
            error instanceof Error ? error.message : "Could not load status.",
          );
      })
      .finally(() => {
        if (!cancelled) setTrustLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mailFeatureFlags.outboundBimi) return;
    const appId = readMailAppIdFromDocument();
    if (!appId) return;
    let cancelled = false;
    void getBimiSetupStatus(appId)
      .then((status) => {
        if (!cancelled) setBimi(status);
      })
      .catch((error) => {
        if (!cancelled)
          setBimiError(
            error instanceof Error ? error.message : "Could not load BIMI.",
          );
      })
      .finally(() => {
        if (!cancelled) setBimiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function requestTrustReview() {
    const appId = readMailAppIdFromDocument();
    if (!appId) return;
    setTrustLoading(true);
    setTrustError("");
    try {
      const result = await requestDomainVerification(appId);
      setTrustRequest(result.request);
    } catch (error) {
      setTrustError(
        error instanceof Error ? error.message : "Could not submit request.",
      );
    } finally {
      setTrustLoading(false);
    }
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const appId = readMailAppIdFromDocument();
    event.target.value = "";
    if (!file || !appId) return;
    setBimiLoading(true);
    setBimiError("");
    try {
      setBimi(await uploadBimiLogo(appId, file));
    } catch (error) {
      setBimiError(
        error instanceof Error ? error.message : "Could not upload BIMI logo.",
      );
    } finally {
      setBimiLoading(false);
    }
  }

  function persist(next: MailDomainSetup) {
    const synced = syncMailDomainRecords(next);
    setSetup(synced);
    writeMailDomainSetup(synced);
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
      records: setup.records.map((record) => ({
        ...record,
        status: "checking",
      })),
    });
    try {
      const result = await verifyDomainRequest(
        setup.domain,
        setup.dkimTokens ?? [],
      );
      persist(
        applyDnsCheckResults(
          setup,
          result.results,
          result.verified,
          result.waiting,
        ),
      );
      if (result.verified) {
        const appId = readMailAppIdFromDocument();
        if (appId) {
          try {
            await fulfillPendingMailbox(appId);
          } catch {
            // User can create the mailbox from Mailboxes after Starter is on.
          }
        }
      }
    } catch {
      persist({
        ...setup,
        status: "FAILED",
        records: setup.records.map((record) => ({
          ...record,
          status: "failed",
        })),
      });
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--muted-foreground)]">
            Domain settings
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="sr-only">{setup.domain}</h1>
            <span className="inline-flex h-10 max-w-full items-center gap-2 rounded-full bg-[var(--foreground)] py-1 pr-1.5 pl-4">
              <span className="truncate text-[15px] font-semibold text-[var(--background)]">
                {setup.domain}
              </span>
              {verified ? (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white">
                  <Check
                    className="size-3.5 text-[var(--primary)]"
                    strokeWidth={3}
                    aria-hidden
                  />
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

      {mailFeatureFlags.outboundBimi ? (
        <section className="rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Brand logo (BIMI)
                </h2>
                {bimi ? (
                  <Chip
                    size="sm"
                    variant="soft"
                    color={bimi.ready ? "success" : "warning"}
                  >
                    {bimi.ready ? "Ready" : "Setup required"}
                  </Chip>
                ) : null}
              </div>
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
                Upload an SVG Tiny PS logo, enforce DMARC, then publish the
                default._bimi TXT record.
              </p>
              {bimiError ? (
                <p className="mt-2 text-sm text-[var(--danger)]">{bimiError}</p>
              ) : null}
            </div>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)]">
              {bimiLoading
                ? "Checking…"
                : bimi?.logoUploaded
                  ? "Replace SVG"
                  : "Upload SVG"}
              <input
                className="sr-only"
                type="file"
                accept="image/svg+xml,.svg"
                disabled={bimiLoading}
                onChange={(event) => void uploadLogo(event)}
              />
            </label>
          </div>

          {bimi ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-[120px_1fr]">
              <div className="flex size-[120px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                {bimi.logoUploaded ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bimi.previewUrl}
                    alt="BIMI logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="px-3 text-center text-xs text-[var(--muted-foreground)]">
                    No logo
                  </span>
                )}
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-[var(--border)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    DMARC enforcement · {bimi.dmarc.status}
                  </p>
                  <code className="mt-1 block break-all text-xs">
                    {bimi.dmarc.record ||
                      "Publish v=DMARC1; p=quarantine; pct=100;"}
                  </code>
                </div>
                <DnsRecordsTable
                  domain={bimi.domain}
                  records={[
                    {
                      ...buildBimiDnsRecord(
                        bimi.logoUrl,
                        bimi.bimi.authorityUrl,
                      ),
                      status:
                        bimi.bimi.status === "VERIFIED" ? "verified" : "failed",
                    },
                  ]}
                  showStatus
                />
                <div className="rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)]">
                  <p className="font-semibold text-[var(--foreground)]">
                    VMC / CMC certificates
                  </p>
                  <p className="mt-1">
                    A VMC can enable the verified checkmark at supporting
                    providers; a CMC can authenticate the logo without
                    guaranteeing that mark. Obtain one from an approved
                    certificate authority, host its PEM over HTTPS, then add its
                    URL as the BIMI a= value.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {mailFeatureFlags.ruknyVerification ? (
        <section className="rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Rukny domain verification
                </h2>
                {trustRequest ? (
                  <Chip
                    size="sm"
                    variant="soft"
                    color={
                      trustRequest.mailApp.domainTrustStatus === "VERIFIED"
                        ? "success"
                        : trustRequest.mailApp.domainTrustStatus ===
                              "REJECTED" ||
                            trustRequest.mailApp.domainTrustStatus === "REVOKED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {trustRequest.mailApp.domainTrustStatus}
                  </Chip>
                ) : null}
              </div>
              <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
                Request an administrative trust review after DNS and SES become
                active.
              </p>
              {trustRequest?.mailApp.domainTrustReason ||
              trustRequest?.rejectionReason ? (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  {trustRequest.mailApp.domainTrustReason ||
                    trustRequest.rejectionReason}
                </p>
              ) : null}
              {trustError ? (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  {trustError}
                </p>
              ) : null}
            </div>
            <Button
              size="sm"
              isDisabled={
                trustLoading ||
                !verified ||
                trustRequest?.status === "PENDING" ||
                trustRequest?.mailApp.domainTrustStatus === "VERIFIED"
              }
              onPress={() => void requestTrustReview()}
            >
              {trustLoading
                ? "Loading…"
                : trustRequest?.status === "PENDING"
                  ? "Review pending"
                  : trustRequest?.mailApp.domainTrustStatus === "VERIFIED"
                    ? "Verified"
                    : "Request verification"}
            </Button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
