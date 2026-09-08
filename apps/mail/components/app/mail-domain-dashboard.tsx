"use client";

import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Chip, cn } from "@heroui/react";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  Circle,
  Clock3,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck,
  Upload,
} from "lucide-react";
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

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "default";
}) {
  return (
    <Chip size="sm" variant="soft" color={tone}>
      {label}
    </Chip>
  );
}

function ReadinessItem({
  complete,
  title,
  detail,
}: {
  complete: boolean;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-[var(--border)]/70 px-3.5 py-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          complete
            ? "bg-[var(--success)] text-white"
            : "bg-[var(--foreground)]/6 text-[var(--muted-foreground)]",
        )}
        aria-hidden
      >
        {complete ? (
          <Check className="size-3" strokeWidth={3} />
        ) : (
          <Circle className="size-2.5" />
        )}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">
          {detail}
        </p>
      </div>
    </li>
  );
}

function Feedback({
  tone,
  title,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  title: string;
  children: ReactNode;
}) {
  const Icon =
    tone === "success"
      ? BadgeCheck
      : tone === "warning"
        ? Clock3
        : tone === "danger"
          ? AlertCircle
          : ShieldCheck;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3.5",
        tone === "success" &&
          "border-[var(--success)]/20 bg-[var(--success)]/6",
        tone === "warning" &&
          "border-[var(--warning)]/20 bg-[var(--warning)]/6",
        tone === "danger" &&
          "border-[var(--danger)]/20 bg-[var(--danger)]/6",
        tone === "neutral" &&
          "border-[var(--border)] bg-[var(--foreground)]/[0.025]",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "success" && "text-[var(--success)]",
          tone === "warning" && "text-[var(--warning)]",
          tone === "danger" && "text-[var(--danger)]",
          tone === "neutral" && "text-[var(--muted-foreground)]",
        )}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        <div className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)]">
          {children}
        </div>
      </div>
    </div>
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
  const [bimiAction, setBimiAction] = useState<"upload" | "recheck" | null>(
    null,
  );
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
    if (!appId) {
      queueMicrotask(() => {
        setTrustLoading(false);
        setTrustError(
          "Could not identify this mail app. Refresh and try again.",
        );
      });
      return;
    }
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
    if (!appId) {
      queueMicrotask(() => {
        setBimiLoading(false);
        setBimiError("Could not identify this mail app. Refresh and try again.");
      });
      return;
    }
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
    setBimiAction("upload");
    setBimiError("");
    try {
      setBimi(await uploadBimiLogo(appId, file));
    } catch (error) {
      setBimiError(
        error instanceof Error ? error.message : "Could not upload BIMI logo.",
      );
    } finally {
      setBimiAction(null);
    }
  }

  async function recheckBimi() {
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      setBimiError("Could not identify this mail app. Refresh and try again.");
      return;
    }
    setBimiAction("recheck");
    setBimiError("");
    try {
      setBimi(await getBimiSetupStatus(appId));
    } catch (error) {
      setBimiError(
        error instanceof Error ? error.message : "Could not recheck BIMI.",
      );
    } finally {
      setBimiAction(null);
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

  const trustApproved =
    trustRequest?.status === "APPROVED" ||
    trustRequest?.mailApp.domainTrustStatus === "VERIFIED";
  const trustPending =
    trustRequest?.status === "PENDING" ||
    trustRequest?.mailApp.domainTrustStatus === "PENDING";
  const trustRejected =
    trustRequest?.status === "REJECTED" ||
    trustRequest?.mailApp.domainTrustStatus === "REJECTED";
  const trustRevoked =
    trustRequest?.mailApp.domainTrustStatus === "REVOKED";
  const trustWithdrawn = trustRequest?.status === "WITHDRAWN";
  const trustReason =
    trustRequest?.mailApp.domainTrustReason ||
    trustRequest?.rejectionReason ||
    null;
  const trustDisabledReason = trustLoading
    ? "Loading the current verification status."
    : !verified
      ? "Activate the domain and finish SES verification before requesting review."
      : trustPending
        ? "Your request is already in the review queue."
        : trustApproved
          ? "This domain is already verified by Rukny."
          : null;

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
        <section
          className="overflow-hidden rounded-2xl bg-[var(--surface)]"
          aria-labelledby="brand-identity-title"
        >
          <div className="border-b border-[var(--border)]/70 p-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="brand-identity-title"
                    className="text-base font-semibold text-[var(--foreground)]"
                  >
                    Brand identity
                  </h2>
                  {bimi ? (
                    <StatusChip
                      label={bimi.ready ? "BIMI ready" : "Setup in progress"}
                      tone={bimi.ready ? "success" : "warning"}
                    />
                  ) : null}
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Publish a verified brand logo so supporting inboxes can show
                  it beside mail from {setup.domain}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void recheckBimi()}
                disabled={bimiLoading || bimiAction !== null}
                className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)]/5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                aria-label="Recheck BIMI readiness"
              >
                <RefreshCw
                  className={cn(
                    "size-3.5",
                    bimiAction === "recheck" && "animate-spin",
                  )}
                  aria-hidden
                />
                {bimiAction === "recheck" ? "Rechecking…" : "Recheck status"}
              </button>
            </div>
            {bimiError ? (
              <p
                className="mt-3 flex items-start gap-2 text-sm text-[var(--danger)]"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {bimiError}
              </p>
            ) : null}
          </div>

          {bimiLoading ? (
            <div
              className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-[var(--muted-foreground)]"
              role="status"
            >
              <RefreshCw className="size-4 animate-spin" aria-hidden />
              Loading brand readiness…
            </div>
          ) : bimi ? (
            <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
              <div className="min-w-0 space-y-5">
                <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                  <div className="flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                    {bimi.logoUploaded ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bimi.previewUrl}
                        alt={`Brand logo preview for ${bimi.domain}`}
                        className="size-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-[var(--muted-foreground)]">
                        <ImageIcon className="size-6" aria-hidden />
                        No logo uploaded
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Your BIMI logo
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      Before uploading, export a static SVG with all of these
                      requirements:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      <li>• SVG Tiny PS, version 1.2, with a title</li>
                      <li>• Positive square viewBox and 256 KB maximum</li>
                      <li>• No scripts, animation, images, links, or external content</li>
                    </ul>
                    <label
                      className={cn(
                        "mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] sm:w-auto",
                        bimiAction !== null &&
                          "cursor-not-allowed opacity-50",
                      )}
                    >
                      <Upload className="size-3.5" aria-hidden />
                      {bimiAction === "upload"
                        ? "Uploading…"
                        : bimi.logoUploaded
                          ? "Replace logo"
                          : "Upload logo"}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/svg+xml,.svg"
                        disabled={bimiAction !== null}
                        aria-label={
                          bimi.logoUploaded
                            ? "Replace BIMI SVG logo"
                            : "Upload BIMI SVG logo"
                        }
                        onChange={(event) => void uploadLogo(event)}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      Readiness checklist
                    </h3>
                    <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                      {
                        [
                          verified,
                          bimi.dmarc.status === "ENFORCED",
                          bimi.logoUploaded,
                          bimi.bimi.status === "VERIFIED",
                        ].filter(Boolean).length
                      }
                      /4 complete
                    </span>
                  </div>
                  <ol className="mt-3 grid gap-2">
                    <ReadinessItem
                      complete={verified}
                      title="Domain and SES active"
                      detail={
                        verified
                          ? "Sending identity is active."
                          : "Finish the domain DNS checks above first."
                      }
                    />
                    <ReadinessItem
                      complete={bimi.dmarc.status === "ENFORCED"}
                      title="DMARC enforcement enabled"
                      detail={
                        bimi.dmarc.status === "ENFORCED"
                          ? `${bimi.dmarc.policy} policy applies to 100% of mail.`
                          : "Use p=quarantine or p=reject with pct=100."
                      }
                    />
                    <ReadinessItem
                      complete={bimi.logoUploaded}
                      title="Brand logo uploaded"
                      detail={
                        bimi.logoUploaded
                          ? "The hosted BIMI logo is available."
                          : "Upload a compliant SVG Tiny PS file."
                      }
                    />
                    <ReadinessItem
                      complete={bimi.bimi.status === "VERIFIED"}
                      title="BIMI TXT record published"
                      detail={
                        bimi.bimi.status === "VERIFIED"
                          ? "The public record matches the expected value."
                          : "Publish the value below, then recheck status."
                      }
                    />
                  </ol>
                </div>
              </div>

              <div className="min-w-0 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    DNS values
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    Copy these exact values to your DNS provider. DNS changes
                    can take time to propagate.
                  </p>
                  <div className="mt-3">
                    <DnsRecordsTable
                      domain={bimi.domain}
                      records={[
                        {
                          id: "bimi-dmarc",
                          purpose: "DMARC",
                          type: "TXT",
                          host: "_dmarc",
                          value: bimi.dmarc.required,
                          status:
                            bimi.dmarc.status === "ENFORCED"
                              ? "verified"
                              : "failed",
                          hint: "BIMI requires quarantine or reject at pct=100.",
                        },
                        {
                          ...buildBimiDnsRecord(
                            bimi.logoUrl,
                            bimi.bimi.authorityUrl,
                          ),
                          status:
                            bimi.bimi.status === "VERIFIED"
                              ? "verified"
                              : "failed",
                        },
                      ]}
                      showStatus
                    />
                  </div>
                </div>

                <Feedback
                  tone={bimi.ready ? "success" : "neutral"}
                  title={
                    bimi.ready
                      ? "Your BIMI setup is ready"
                      : "Complete all four steps"
                  }
                >
                  {bimi.ready
                    ? "Supporting mailbox providers can now discover your brand logo."
                    : "After publishing DNS, use Recheck status to confirm the public records."}
                </Feedback>

                <div className="rounded-xl border border-[var(--border)] px-4 py-3.5">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Optional: VMC or CMC
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    A VMC may add a verified checkmark at supported providers. A
                    CMC validates logo ownership but does not guarantee a
                    checkmark. Your certificate authority supplies the HTTPS
                    PEM URL used in the BIMI a= value.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <Feedback tone="danger" title="Brand status unavailable">
                Refresh the page or use Recheck status to try again.
              </Feedback>
            </div>
          )}
        </section>
      ) : null}

      {mailFeatureFlags.ruknyVerification ? (
        <section
          className="rounded-2xl bg-[var(--surface)] p-4 md:px-6 md:py-5"
          aria-labelledby="rukny-verification-title"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="rukny-verification-title"
                  className="text-base font-semibold text-[var(--foreground)]"
                >
                  Rukny domain verification
                </h2>
                <StatusChip
                  label={
                    trustLoading
                      ? "Loading status"
                      : trustApproved
                        ? "Approved"
                        : trustPending
                          ? "Under review"
                          : trustRevoked
                            ? "Revoked"
                            : trustRejected
                              ? "Not approved"
                              : trustWithdrawn
                                ? "Withdrawn"
                                : "Not requested"
                  }
                  tone={
                    trustApproved
                      ? "success"
                      : trustRejected || trustRevoked
                        ? "danger"
                        : trustPending
                          ? "warning"
                          : "default"
                  }
                />
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                Rukny reviews active sending domains for ownership and trusted
                use. Approval is separate from BIMI and its certificates.
              </p>

              <div className="mt-4">
                {trustLoading ? (
                  <Feedback tone="neutral" title="Loading verification status">
                    Checking for an existing review request…
                  </Feedback>
                ) : trustApproved ? (
                  <Feedback tone="success" title="Domain approved">
                    Rukny has verified this domain for trusted sending.
                  </Feedback>
                ) : trustPending ? (
                  <Feedback tone="warning" title="Review in progress">
                    Your request is in the review queue. No further action is
                    needed right now.
                  </Feedback>
                ) : trustRevoked ? (
                  <Feedback tone="danger" title="Verification revoked">
                    The previous approval is no longer active. You can submit a
                    new request after addressing the reason below.
                  </Feedback>
                ) : trustRejected ? (
                  <Feedback tone="danger" title="Request not approved">
                    Review the reason below, make the required changes, and
                    submit again.
                  </Feedback>
                ) : trustWithdrawn ? (
                  <Feedback tone="neutral" title="Request withdrawn">
                    This request is closed. Submit a new one when you are ready.
                  </Feedback>
                ) : (
                  <Feedback
                    tone={verified ? "neutral" : "warning"}
                    title={verified ? "Eligible for review" : "Not eligible yet"}
                  >
                    {verified
                      ? "Your domain and SES identity are active, so you can request verification."
                      : "Complete domain DNS setup and SES verification before requesting review."}
                  </Feedback>
                )}
              </div>

              {trustReason ? (
                <div className="mt-3 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Review reason
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[var(--danger)]">
                    {trustReason}
                  </p>
                </div>
              ) : null}
              {trustError ? (
                <p
                  className="mt-3 flex items-start gap-2 text-sm text-[var(--danger)]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {trustError}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Eligibility
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                {verified ? (
                  <Check className="size-4 text-[var(--success)]" aria-hidden />
                ) : (
                  <Clock3
                    className="size-4 text-[var(--warning)]"
                    aria-hidden
                  />
                )}
                {verified ? "Ready to request" : "Domain activation required"}
              </p>
              <Button
                className="mt-4 h-10 w-full rounded-xl"
                isDisabled={Boolean(trustDisabledReason)}
                aria-describedby={
                  trustDisabledReason ? "trust-disabled-reason" : undefined
                }
                onPress={() => void requestTrustReview()}
              >
                {trustLoading
                  ? "Loading status…"
                  : trustPending
                    ? "Verification under review"
                    : trustApproved
                      ? "Domain verified"
                      : "Request Rukny verification"}
              </Button>
              {trustDisabledReason ? (
                <p
                  id="trust-disabled-reason"
                  className="mt-2 text-center text-xs leading-5 text-[var(--muted-foreground)]"
                >
                  {trustDisabledReason}
                </p>
              ) : (
                <p className="mt-2 text-center text-xs leading-5 text-[var(--muted-foreground)]">
                  One request starts the administrative review.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}
