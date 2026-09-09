"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Chip, cn } from "@heroui/react";
import {
  AlertCircle,
  Check,
  Circle,
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from "lucide-react";
import { DnsRecordsTable } from "@/components/app/dns-records-table";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  buildBimiDnsRecord,
  dmarcEnforcementValue,
  type MailBimiSetupStatus,
  type MailDnsRecord,
} from "@/lib/mail-domain";
import {
  getBimiSetupStatus,
  uploadBimiLogo,
} from "@/lib/mail-domain-verification-client";

const MAX_SOURCE_SVG_BYTES = 256 * 1024;

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

export function MailBimiSetupPanel({
  domain,
  domainActive,
}: {
  domain: string;
  domainActive: boolean;
}) {
  const [status, setStatus] = useState<MailBimiSetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"upload" | "recheck" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const appId = readMailAppIdFromDocument();
    let cancelled = false;

    async function load() {
      if (!appId) {
        if (!cancelled) {
          setError("Could not identify this mail app. Refresh and try again.");
          setLoading(false);
        }
        return;
      }
      try {
        const next = await getBimiSetupStatus(appId);
        if (!cancelled) setStatus(next);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load BIMI status.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const records = useMemo<MailDnsRecord[]>(() => {
    if (!status) return [];
    const dmarc: MailDnsRecord = {
      id: "bimi-dmarc",
      purpose: "DMARC",
      type: "TXT",
      host: "_dmarc",
      value: dmarcEnforcementValue(),
      status: status.dmarc.status === "ENFORCED" ? "verified" : "failed",
      hint: "BIMI requires quarantine or reject at pct=100.",
    };
    const bimi = buildBimiDnsRecord(status.logoUrl);
    bimi.status = status.bimi.status === "VERIFIED" ? "verified" : "failed";
    return [dmarc, bimi];
  }, [status]);

  async function recheck() {
    const appId = readMailAppIdFromDocument();
    if (!appId) {
      setError("Could not identify this mail app. Refresh and try again.");
      return;
    }
    setAction("recheck");
    setError("");
    try {
      setStatus(await getBimiSetupStatus(appId));
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : "Could not recheck BIMI status.",
      );
    } finally {
      setAction(null);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const appId = readMailAppIdFromDocument();
    event.target.value = "";
    if (!file || !appId) return;
    if (
      !file.name.toLowerCase().endsWith(".svg") &&
      file.type !== "image/svg+xml"
    ) {
      setError("Choose an SVG file.");
      return;
    }
    if (file.size > MAX_SOURCE_SVG_BYTES) {
      setError("The source SVG must be 256KB or smaller.");
      return;
    }

    setAction("upload");
    setError("");
    try {
      setStatus(await uploadBimiLogo(appId, file));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the BIMI logo.",
      );
    } finally {
      setAction(null);
    }
  }

  const completed = status
    ? [
        domainActive,
        status.dmarc.status === "ENFORCED",
        status.logoUploaded,
        status.bimi.status === "VERIFIED",
      ].filter(Boolean).length
    : 0;

  return (
    <section
      className="overflow-hidden rounded-2xl bg-[var(--surface)]"
      aria-labelledby="bimi-setup-title"
    >
      <div className="border-b border-[var(--border)]/70 p-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="bimi-setup-title"
                className="text-base font-semibold text-[var(--foreground)]"
              >
                BIMI logo
              </h2>
              {status ? (
                <Chip
                  size="sm"
                  variant="soft"
                  color={status.ready ? "success" : "warning"}
                >
                  {status.ready ? "Ready" : "Setup in progress"}
                </Chip>
              ) : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Host a standards-ready logo and publish one DNS record for{" "}
              {domain}. Display remains controlled by each mailbox provider.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void recheck()}
            disabled={loading || action !== null}
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)]/5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                action === "recheck" && "animate-spin",
              )}
              aria-hidden
            />
            {action === "recheck" ? "Checking…" : "Check status"}
          </button>
        </div>
        {error ? (
          <p
            className="mt-3 flex items-start gap-2 text-sm text-[var(--danger)]"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div
          className="flex min-h-44 items-center justify-center gap-2 p-6 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          <RefreshCw className="size-4 animate-spin" aria-hidden />
          Loading BIMI setup…
        </div>
      ) : status ? (
        <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]">
          <div className="min-w-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
              <div className="flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                {status.logoUploaded ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${status.previewUrl}-${action ?? "idle"}`}
                    src={status.previewUrl}
                    alt={`BIMI logo preview for ${status.domain}`}
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
                  Upload your logo
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  Use a square SVG up to 256KB. Rukny removes unsupported
                  metadata and validates a final SVG Tiny PS file under 32KB.
                </p>
                <label
                  className={cn(
                    "mt-3 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] sm:w-auto",
                    action !== null && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Upload className="size-3.5" aria-hidden />
                  {action === "upload"
                    ? "Uploading…"
                    : status.logoUploaded
                      ? "Replace SVG"
                      : "Upload SVG"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/svg+xml,.svg"
                    disabled={action !== null}
                    aria-label={
                      status.logoUploaded
                        ? "Replace BIMI SVG logo"
                        : "Upload BIMI SVG logo"
                    }
                    onChange={(event) => void upload(event)}
                  />
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Readiness
                </h3>
                <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                  {completed}/4 complete
                </span>
              </div>
              <ol className="mt-3 grid gap-2">
                <ReadinessItem
                  complete={domainActive}
                  title="Domain and SES active"
                  detail={
                    domainActive
                      ? "The sending domain is active."
                      : "Finish the domain DNS checks above first."
                  }
                />
                <ReadinessItem
                  complete={status.dmarc.status === "ENFORCED"}
                  title="DMARC enforcement enabled"
                  detail={
                    status.dmarc.status === "ENFORCED"
                      ? `${status.dmarc.policy} applies to ${status.dmarc.percentage}% of mail.`
                      : "Publish p=quarantine or p=reject with pct=100."
                  }
                />
                <ReadinessItem
                  complete={status.logoUploaded}
                  title="SVG logo hosted"
                  detail={
                    status.logoUploaded
                      ? "The public HTTPS logo is available."
                      : "Upload a safe square SVG logo."
                  }
                />
                <ReadinessItem
                  complete={status.bimi.status === "VERIFIED"}
                  title="BIMI record published"
                  detail={
                    status.bimi.status === "VERIFIED"
                      ? "The public DNS record matches this logo."
                      : "Copy the BIMI value, publish it, then check again."
                  }
                />
              </ol>
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              DNS values
            </h3>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
              Copy these values exactly. DNS updates can take time to propagate.
            </p>
            <div className="mt-3">
              <DnsRecordsTable
                domain={status.domain}
                records={records}
                showStatus
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-sm text-[var(--muted-foreground)]">
          BIMI setup is unavailable right now. Refresh the page and try again.
        </div>
      )}
    </section>
  );
}
