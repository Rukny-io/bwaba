"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, Shield } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCurrentApp } from "@/components/providers/app-context";
import { useApiKeys } from "@/hooks/use-api-keys";
import { appApiKeysNew, appEmailApiHref } from "@/lib/app-routes";
import {
  executeEmailApiTry,
  listEmailDomains,
  listEmailSenders,
} from "@/lib/api/email-api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function recipientDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

export function EmailApiTryIt({
  accountEmail = "",
}: {
  accountEmail?: string;
}) {
  const { app } = useCurrentApp();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys(app.id);
  const sendersQuery = useQuery({
    queryKey: ["email-api", app.appId, "senders"],
    queryFn: () => listEmailSenders(app.appId),
  });
  const domainsQuery = useQuery({
    queryKey: ["email-api", app.appId, "domains"],
    queryFn: () => listEmailDomains(app.appId),
  });

  const keys = useMemo(
    () =>
      (apiKeys ?? []).filter(
        (key) =>
          key.environment === "test" &&
          key.status === "ACTIVE" &&
          key.scopes.includes("email:send"),
      ),
    [apiKeys],
  );

  const authorizedSenders = useMemo(
    () =>
      (sendersQuery.data ?? []).filter(
        (sender) =>
          sender.status === "active" && sender.domainStatus === "verified",
      ),
    [sendersQuery.data],
  );

  const verifiedDomains = useMemo(
    () =>
      (domainsQuery.data ?? [])
        .filter((domain) => domain.status === "verified")
        .map((domain) => domain.domain.toLowerCase()),
    [domainsQuery.data],
  );

  const [apiKeySlug, setApiKeySlug] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(accountEmail);
  const [subject, setSubject] = useState("Email API test");
  const [bodyText, setBodyText] = useState("Hello from Rukny Email API.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiKeySlug && keys[0]?.slug) {
      setApiKeySlug(keys[0].slug);
    }
  }, [apiKeySlug, keys]);

  useEffect(() => {
    if (!from && authorizedSenders[0]?.email) {
      setFrom(authorizedSenders[0].email);
    }
  }, [authorizedSenders, from]);

  useEffect(() => {
    if (accountEmail && !to) {
      setTo(accountEmail);
    }
  }, [accountEmail, to]);

  function isAllowedRecipient(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    if (accountEmail && normalized === accountEmail.trim().toLowerCase()) {
      return true;
    }
    const domain = recipientDomain(normalized);
    return Boolean(domain && verifiedDomains.includes(domain));
  }

  async function send() {
    if (!apiKeySlug || !from || !to || !subject || !bodyText) {
      setError("Complete all fields and select a test key.");
      return;
    }
    if (!isAllowedRecipient(to)) {
      const domainsLabel =
        verifiedDomains.length > 0
          ? verifiedDomains.join(", ")
          : "none yet";
      setError(
        `Test sends only allow your account email${
          accountEmail ? ` (${accountEmail})` : ""
        } or an address on a verified domain (${domainsLabel}). ` +
          `Add and verify the recipient domain under Domains first.`,
      );
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const response = await executeEmailApiTry({
        appId: app.appId,
        apiKeySlug,
        from,
        to,
        subject,
        bodyText,
      });
      setResult(
        `HTTP ${response.status}\n${JSON.stringify(response.body, null, 2)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  const sendersLoading = sendersQuery.isLoading;
  const noSenders = !sendersLoading && authorizedSenders.length === 0;

  return (
    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 size-5 text-[var(--primary)]" />
        <div>
          <h2 className="text-base font-semibold">Try it safely</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            Uses a test key only. Recipients must be your account email or an
            address on a verified domain you own.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Test API key
          </span>
          <Select
            value={apiKeySlug}
            onValueChange={setApiKeySlug}
            disabled={keysLoading || keys.length === 0}
          >
            <SelectTrigger className="h-11 border-0 bg-[var(--surface-secondary)] focus:ring-0">
              <SelectValue
                placeholder={
                  keysLoading ? "Loading keys…" : "Select test key"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {keys.map((key) => (
                <SelectItem key={key.slug} value={key.slug}>
                  {key.name} · …{key.keySuffix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            From (authorized sender)
          </span>
          <Select
            value={from}
            onValueChange={setFrom}
            disabled={sendersLoading || authorizedSenders.length === 0}
          >
            <SelectTrigger className="h-11 border-0 bg-[var(--surface-secondary)] focus:ring-0">
              <SelectValue
                placeholder={
                  sendersLoading
                    ? "Loading senders…"
                    : noSenders
                      ? "No authorized sender"
                      : "Select sender"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {authorizedSenders.map((sender) => (
                <SelectItem key={sender.id} value={sender.email}>
                  {sender.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            To
          </span>
          <input
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder={accountEmail || "you@example.com"}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
          />
          <span className="block text-[11px] leading-5 text-[var(--muted-foreground)]">
            Allowed now:{" "}
            {accountEmail ? (
              <code className="text-[var(--foreground)]">{accountEmail}</code>
            ) : (
              "your account email"
            )}
            {verifiedDomains.length > 0 ? (
              <>
                {" "}
                or *@
                {verifiedDomains.map((domain, index) => (
                  <span key={domain}>
                    {index > 0 ? ", *@" : ""}
                    <code className="text-[var(--foreground)]">{domain}</code>
                  </span>
                ))}
              </>
            ) : (
              <> — no verified recipient domains yet</>
            )}
            .{" "}
            <Link
              href={appEmailApiHref(app.appId, "domains")}
              className="underline underline-offset-2"
            >
              Manage Domains
            </Link>
          </span>
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Subject
          </span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-[var(--muted-foreground)]">
            Text body
          </span>
          <textarea
            value={bodyText}
            onChange={(event) => setBodyText(event.target.value)}
            rows={4}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm"
          />
        </label>
      </div>
      {noSenders ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Authorize a sender under{" "}
          <Link
            href={appEmailApiHref(app.appId, "domains")}
            className="underline underline-offset-2"
          >
            Domains
          </Link>{" "}
          before using Try it.
        </p>
      ) : null}
      {!keys.length && !keysLoading ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Create a{" "}
          <Link
            href={appApiKeysNew(app.appId)}
            className="underline underline-offset-2"
          >
            test key
          </Link>{" "}
          with <code>email:send</code> first.
        </p>
      ) : null}
      <button
        type="button"
        disabled={loading || noSenders || keys.length === 0}
        onClick={() => void send()}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Send test
      </button>
      {error ? (
        <p className="mt-3 text-sm text-[var(--destructive)]">{error}</p>
      ) : null}
      {result ? (
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 text-xs leading-relaxed">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
