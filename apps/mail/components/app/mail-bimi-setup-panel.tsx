"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { Chip, cn } from "@heroui/react";
import {
  AlertCircle,
  Check,
  Circle,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  buildBimiDnsRecord,
  dmarcEnforcementValue,
  type MailBimiSetupStatus,
  type MailDnsRecord,
} from "@/lib/mail-domain";
import {
  deleteBimiAuthority,
  deleteBimiLogo,
  getBimiSetupStatus,
  uploadBimiAuthority,
  uploadBimiLogo,
} from "@/lib/mail-domain-verification-client";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_SOURCE_SVG_BYTES = 256 * 1024;
const LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
const LOGO_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

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
    <li className="flex gap-3 py-2">
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
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {title}
        </p>
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
  const [action, setAction] = useState<
    "upload" | "delete" | "upload-cert" | "delete-cert" | "recheck" | null
  >(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

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
    const bimi = buildBimiDnsRecord(status.logoUrl, status.authorityUrl);
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
    const lowerName = file.name.toLowerCase();
    const isSupported =
      LOGO_EXTENSIONS.some((extension) => lowerName.endsWith(extension)) ||
      LOGO_MIME_TYPES.has(file.type);
    if (!isSupported) {
      setError("Choose a PNG, JPG, WebP, or SVG logo.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("The logo must be 2MB or smaller.");
      return;
    }
    if (
      (lowerName.endsWith(".svg") || file.type === "image/svg+xml") &&
      file.size > MAX_SOURCE_SVG_BYTES
    ) {
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

  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(
      () => setCopied((current) => (current === id ? null : current)),
      1200,
    );
  }

  async function removeLogo() {
    const appId = readMailAppIdFromDocument();
    if (!appId || !status?.logoUploaded) return;
    if (
      !window.confirm(
        "Delete the current BIMI logo? Your DNS record will remain unchanged.",
      )
    ) {
      return;
    }

    setAction("delete");
    setError("");
    try {
      setStatus(await deleteBimiLogo(appId));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the BIMI logo.",
      );
    } finally {
      setAction(null);
    }
  }

  async function uploadCertificate(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const appId = readMailAppIdFromDocument();
    event.target.value = "";
    if (!file || !appId) return;

    setAction("upload-cert");
    setError("");
    try {
      setStatus(await uploadBimiAuthority(appId, file));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload the CMC/VMC certificate.",
      );
    } finally {
      setAction(null);
    }
  }

  async function removeCertificate() {
    const appId = readMailAppIdFromDocument();
    if (!appId || !status?.certificateUploaded) return;
    if (
      !window.confirm(
        "Delete the current CMC/VMC certificate? Update your BIMI DNS record afterward.",
      )
    ) {
      return;
    }

    setAction("delete-cert");
    setError("");
    try {
      setStatus(await deleteBimiAuthority(appId));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the certificate.",
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
        status.certificateUploaded,
        status.bimi.status === "VERIFIED",
      ].filter(Boolean).length
    : 0;

  return (
    <section
      className="rounded-2xl bg-[var(--surface)] p-4 md:p-6"
      aria-labelledby="bimi-setup-title"
    >
      <div>
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
              Upload your logo and CMC/VMC certificate. Rukny hosts both and
              gives you the BIMI DNS values for {domain}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void recheck()}
            disabled={loading || action !== null}
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--foreground)]/5 px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--foreground)]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <RefreshCw
              className={cn("size-3.5", action === "recheck" && "animate-spin")}
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
          className="flex min-h-44 items-center justify-center gap-2 pt-6 text-sm text-[var(--muted-foreground)]"
          role="status"
        >
          <RefreshCw className="size-4 animate-spin" aria-hidden />
          Loading BIMI setup…
        </div>
      ) : status ? (
        <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(360px,1.15fr)]">
          <div className="min-w-0 space-y-7">
            <div className="grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
              <div className="flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden rounded-2xl bg-[var(--foreground)]/5">
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
                  Convert and install your logo
                </h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                  PNG, JPG, or WebP up to 2MB, or SVG up to 256KB. Raster logos
                  are automatically prepared as a one-color BIMI file.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label
                    className={cn(
                      "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] sm:w-auto",
                      action !== null && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Upload className="size-3.5" aria-hidden />
                    {action === "upload"
                      ? "Converting…"
                      : status.logoUploaded
                        ? "Replace logo"
                        : "Upload logo"}
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
                      disabled={action !== null}
                      aria-label={
                        status.logoUploaded
                          ? "Replace BIMI logo"
                          : "Upload logo for BIMI conversion"
                      }
                      onChange={(event) => void upload(event)}
                    />
                  </label>
                  {status.logoUploaded ? (
                    <button
                      type="button"
                      onClick={() => void removeLogo()}
                      disabled={action !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      {action === "delete" ? "Deleting…" : "Delete"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                CMC / VMC certificate
              </h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                Upload the PEM chain from your certificate authority. Rukny
                hosts it and adds the <span className="font-mono">a=</span> URL
                to your BIMI DNS record.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label
                  className={cn(
                    "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] sm:w-auto",
                    action !== null && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Upload className="size-3.5" aria-hidden />
                  {action === "upload-cert"
                    ? "Uploading…"
                    : status.certificateUploaded
                      ? "Replace certificate"
                      : "Upload certificate"}
                  <input
                    className="sr-only"
                    type="file"
                    accept=".pem,.crt,.cer,application/pem-certificate-chain,application/x-pem-file,application/x-x509-ca-cert,text/plain"
                    disabled={action !== null}
                    aria-label={
                      status.certificateUploaded
                        ? "Replace CMC/VMC certificate"
                        : "Upload CMC/VMC certificate"
                    }
                    onChange={(event) => void uploadCertificate(event)}
                  />
                </label>
                {status.certificateUploaded ? (
                  <button
                    type="button"
                    onClick={() => void removeCertificate()}
                    disabled={action !== null}
                    className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {action === "delete-cert" ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
              {status.certificateUploaded && status.authorityUrl ? (
                <p className="mt-2 break-all font-mono text-[11px] leading-5 text-[var(--muted-foreground)]">
                  {status.authorityUrl}
                </p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Readiness
                </h3>
                <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                  {completed}/5 complete
                </span>
              </div>
              <ol className="mt-2 grid">
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
                  title="BIMI logo converted and hosted"
                  detail={
                    status.logoUploaded
                      ? "The public HTTPS logo is available."
                      : "Upload your logo and Rukny will prepare it."
                  }
                />
                <ReadinessItem
                  complete={status.certificateUploaded}
                  title="CMC / VMC certificate hosted"
                  detail={
                    status.certificateUploaded
                      ? "The public HTTPS authority certificate is available."
                      : "Upload your PEM certificate to enable the verified mark."
                  }
                />
                <ReadinessItem
                  complete={status.bimi.status === "VERIFIED"}
                  title="BIMI record published"
                  detail={
                    status.bimi.status === "VERIFIED"
                      ? "The public DNS record matches this logo and certificate."
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
            <div className="mt-4 grid gap-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl bg-[var(--foreground)]/5 p-3.5"
                >
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          record.status === "verified"
                            ? "bg-[var(--success)]"
                            : "bg-[var(--muted-foreground)]/35",
                        )}
                        aria-hidden
                      />
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        {record.purpose}
                      </span>
                    </div>
                    <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                      {record.type}
                    </span>
                  </div>

                  {[
                    { key: "host", label: "Host", value: record.host },
                    { key: "value", label: "Value", value: record.value },
                  ].map((field) => {
                    const copyId = `${record.id}-${field.key}`;
                    return (
                      <div
                        key={field.key}
                        className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-start gap-2 py-1"
                      >
                        <span className="pt-1 text-[11px] text-[var(--muted-foreground)]">
                          {field.label}
                        </span>
                        <span className="break-all font-mono text-xs leading-5 text-[var(--foreground)]">
                          {field.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copy(copyId, field.value)}
                          className="flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--foreground)]/10 hover:text-[var(--foreground)]"
                          aria-label={`Copy ${field.label.toLowerCase()}`}
                        >
                          {copied === copyId ? (
                            <Check className="size-3.5" aria-hidden />
                          ) : (
                            <Copy className="size-3.5" aria-hidden />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-6 text-sm text-[var(--muted-foreground)]">
          BIMI setup is unavailable right now. Refresh the page and try again.
        </div>
      )}
    </section>
  );
}
