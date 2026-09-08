"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  CircleDashed,
  Copy,
  Download,
  Globe2,
  Loader2,
  MailPlus,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentApp } from "@/components/providers/app-context";
import { appToast } from "@/lib/app-toast";
import {
  createEmailDomain,
  createEmailSender,
  listEmailDomains,
  listEmailSenders,
  refreshEmailDomain,
  type EmailDomain,
} from "@/lib/api/email-api";
import { cn } from "@/lib/utils";

const queryKey = (appId: string) => ["email-api", appId] as const;

function dnsRecords(item: EmailDomain) {
  return item.dkimTokens.map((token) => ({
    type: "CNAME",
    name: `${token}._domainkey.${item.domain}`,
    value: `${token}.dkim.amazonses.com`,
  }));
}

function dnsText(item: EmailDomain) {
  const records = dnsRecords(item);
  return [
    "; Rukny Email API - DNS verification records",
    `; Domain: ${item.domain}`,
    `; Generated: ${new Date().toISOString()}`,
    "; BIND zone-file format, ready for DNS import.",
    "",
    ...records.map(
      (record) => `${record.name}. 300 IN ${record.type} ${record.value}.`,
    ),
    "",
  ].join("\n");
}

export function EmailApiDomainManager() {
  const { app } = useCurrentApp();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");
  const [sender, setSender] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const key = queryKey(app.appId);

  const domains = useQuery({
    queryKey: [...key, "domains"],
    queryFn: () => listEmailDomains(app.appId),
  });
  const senders = useQuery({
    queryKey: [...key, "senders"],
    queryFn: () => listEmailSenders(app.appId),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });
  const addDomain = useMutation({
    mutationFn: () => createEmailDomain(app.appId, domain),
    onSuccess: () => {
      setDomain("");
      void invalidate();
      appToast.success("Domain verification started.");
    },
    onError: (error) => appToast.fromError(error, "Could not add domain."),
  });
  const addSender = useMutation({
    mutationFn: () => createEmailSender(app.appId, sender),
    onSuccess: () => {
      setSender("");
      void invalidate();
      appToast.success("Sender authorized for this app.");
    },
    onError: (error) =>
      appToast.fromError(error, "Could not authorize sender."),
  });
  const refresh = useMutation({
    mutationFn: (value: string) => refreshEmailDomain(app.appId, value),
    onSuccess: () => {
      void invalidate();
      appToast.success("Domain status refreshed.");
    },
    onError: (error) => appToast.fromError(error, "Could not refresh domain."),
  });

  async function copy(value: string, id = value) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1500);
  }

  function downloadDns(item: EmailDomain) {
    const url = URL.createObjectURL(
      new Blob([dnsText(item)], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.domain}-rukny-dns.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    appToast.success("DNS records exported.");
  }

  const verifiedCount =
    domains.data?.filter((item) => item.status === "verified").length ?? 0;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-[var(--surface)]">
        <div className="grid lg:grid-cols-[1fr_360px]">
          <div className="p-5 sm:p-7">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))] text-[var(--primary)]">
              <Globe2 className="size-5" />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">
              Connect your sending domain
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-[var(--muted-foreground)]">
              Verify ownership once, then authorize addresses such as{" "}
              <code className="text-[var(--foreground)]">
                noreply@yourdomain.com
              </code>{" "}
              for this application.
            </p>
            <form
              className="mt-6 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (domain.trim()) addDomain.mutate();
              }}
            >
              <div className="relative min-w-0 flex-1">
                <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="yourdomain.com"
                  inputMode="url"
                  aria-label="Domain name"
                  className="h-11 w-full rounded-xl bg-[var(--surface-secondary)] pl-10 pr-3 text-sm outline-none transition focus:bg-[var(--background)]"
                />
              </div>
              <button
                disabled={addDomain.isPending || !domain.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addDomain.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add domain
              </button>
            </form>
          </div>

          <div className="bg-[var(--surface-secondary)]/60 p-5 sm:p-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Sending readiness
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <p className="text-2xl font-semibold">{verifiedCount}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Verified domains
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-4">
                <p className="text-2xl font-semibold">
                  {senders.data?.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Active senders
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-2.5 text-xs leading-5 text-[var(--muted-foreground)]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
              DKIM protects sender identity and improves inbox placement.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              DNS setup
            </p>
            <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
              Verification records
            </h2>
            <p className="mt-1.5 text-[13px] text-[var(--muted-foreground)]">
              Add all records at your DNS provider, then refresh the status.
            </p>
          </div>
          {domains.data?.length ? (
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]">
              {domains.data.length}{" "}
              {domains.data.length === 1 ? "domain" : "domains"}
            </span>
          ) : null}
        </div>

        {domains.isLoading ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="size-4 animate-spin" />
            Loading domains…
          </div>
        ) : domains.data?.length ? (
          <div className="mt-6 space-y-4">
            {domains.data.map((item) => {
              const records = dnsRecords(item);
              const allId = `all:${item.domain}`;
              const verified = item.status === "verified";

              return (
                <article
                  key={item.domain}
                  className="overflow-hidden rounded-2xl bg-[var(--background)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)]/45 px-4 py-4 sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          verified
                            ? "bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] text-[var(--success)]"
                            : "bg-[color-mix(in_srgb,var(--warning)_13%,var(--surface))] text-[var(--warning)]",
                        )}
                      >
                        {verified ? (
                          <CheckCircle2 className="size-4.5" />
                        ) : (
                          <CircleDashed className="size-4.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium">
                          {item.domain}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 text-xs capitalize",
                            verified
                              ? "text-[var(--success)]"
                              : "text-[var(--warning)]",
                          )}
                        >
                          {verified ? "Verified and ready" : item.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!verified && records.length ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void copy(dnsText(item), allId)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 text-xs font-medium transition hover:opacity-75"
                          >
                            {copied === allId ? (
                              <Check className="size-3.5 text-[var(--success)]" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            Copy all
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDns(item)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--surface)] px-3 text-xs font-medium transition hover:opacity-75"
                          >
                            <Download className="size-3.5" />
                            Export TXT
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => refresh.mutate(item.domain)}
                        disabled={
                          refresh.isPending && refresh.variables === item.domain
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3 text-xs font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-60"
                      >
                        <RefreshCw
                          className={cn(
                            "size-3.5",
                            refresh.isPending &&
                              refresh.variables === item.domain &&
                              "animate-spin",
                          )}
                        />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {!verified ? (
                    records.length ? (
                      <div className="p-3 sm:p-4">
                        <div className="hidden grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] sm:grid">
                          <span>Type</span>
                          <span>Name</span>
                          <span>Value</span>
                          <span />
                        </div>
                        <div className="space-y-2">
                          {records.map((record) => {
                            const recordText = `${record.type}\t${record.name}\t${record.value}`;
                            return (
                              <div
                                key={record.name}
                                className="grid gap-2 rounded-xl bg-[var(--surface-secondary)] p-3 sm:grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)_32px] sm:items-center sm:gap-3"
                              >
                                <span className="w-fit rounded-md bg-[var(--surface)] px-2 py-1 font-mono text-[10px] font-semibold text-[var(--primary)]">
                                  {record.type}
                                </span>
                                <code className="break-all text-[11px] leading-5">
                                  {record.name}
                                </code>
                                <code className="break-all text-[11px] leading-5 text-[var(--muted-foreground)]">
                                  {record.value}
                                </code>
                                <button
                                  type="button"
                                  aria-label={`Copy ${record.name}`}
                                  onClick={() =>
                                    void copy(recordText, record.name)
                                  }
                                  className="flex size-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                                >
                                  {copied === record.name ? (
                                    <Check className="size-3.5 text-[var(--success)]" />
                                  ) : (
                                    <Copy className="size-3.5" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-5 text-xs text-[var(--muted-foreground)]">
                        <Loader2 className="size-3.5 animate-spin" />
                        DKIM records are being prepared. Refresh shortly.
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2.5 p-5 text-sm text-[var(--muted-foreground)]">
                      <CheckCircle2 className="size-4 text-[var(--success)]" />
                      DNS verification is complete. You can authorize a sender
                      below.
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-[var(--surface-secondary)] px-6 py-10 text-center">
            <Globe2 className="size-6 text-[var(--muted-foreground)]" />
            <p className="mt-3 text-sm font-medium">No domains connected</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Add your first domain above to generate DKIM records.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-[var(--surface)] p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
            <MailPlus className="size-4.5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Authorized senders</h2>
            <p className="mt-1 text-[13px] leading-5 text-[var(--muted-foreground)]">
              Live API keys can only send from addresses explicitly authorized
              for this application.
            </p>
          </div>
        </div>
        <form
          className="mt-5 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            if (sender.trim()) addSender.mutate();
          }}
        >
          <input
            value={sender}
            onChange={(event) => setSender(event.target.value)}
            placeholder="noreply@yourdomain.com"
            type="email"
            aria-label="Sender email address"
            className="h-11 min-w-0 flex-1 rounded-xl bg-[var(--surface-secondary)] px-3.5 text-sm outline-none transition focus:bg-[var(--background)]"
          />
          <button
            disabled={addSender.isPending || !sender.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addSender.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Authorize sender
          </button>
        </form>
        {senders.data?.length ? (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {senders.data.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--background)] px-3.5 py-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="size-2 shrink-0 rounded-full bg-[var(--success)]" />
                  <code className="min-w-0 truncate text-xs">{item.email}</code>
                </div>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-medium capitalize text-[var(--muted-foreground)]">
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            No sender addresses authorized yet.
          </p>
        )}
      </section>
    </div>
  );
}
