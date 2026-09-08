"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useCurrentApp } from "@/components/providers/app-context";
import { appApiKeysNew, appEmailApi } from "@/lib/app-routes";
import { EmailApiDomainManager } from "./email-api-domain-manager";
import { EmailApiSubscriptionCard } from "./email-api-subscription-card";
import { EmailApiTryIt } from "./email-api-try-it";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.rukny.io/api/v1"
).replace(/\/$/, "");

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 text-[12px] leading-relaxed text-[var(--foreground)]">
      <code>{children}</code>
    </pre>
  );
}

export function EmailApiDocs({
  section,
}: {
  section: "overview" | "auth" | "messages" | "domains" | "try";
}) {
  const { app } = useCurrentApp();
  const base = appEmailApi(app.appId);

  if (section === "auth")
    return (
      <div className="space-y-4">
        <Card title="Authentication">
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            Create an app-scoped key with only the required permissions. Keep it
            on your server; never expose it in a browser or mobile client.
          </p>
          <Code>{`X-API-Key: rk_live_...\nIdempotency-Key: unique_key_for_this_send`}</Code>
          <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">
            Required scopes: <code>email:send</code> to send and{" "}
            <code>email:read</code> to check delivery state. Use test keys only
            to send to your account email.
          </p>
          <Link
            href={appApiKeysNew(app.appId)}
            className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
          >
            Create an API key
          </Link>
        </Card>
        <Card title="Security">
          <ul className="mt-3 list-disc space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
            <li>
              Restrict production keys with an IP allowlist and expiry date.
            </li>
            <li>Rotate and revoke a key immediately if it is exposed.</li>
            <li>Use a distinct key per environment and backend service.</li>
            <li>
              Idempotency keys prevent duplicate billing and duplicate sends
              during retries.
            </li>
          </ul>
        </Card>
      </div>
    );

  if (section === "messages")
    return (
      <div className="space-y-4">
        <Card title="Send a transactional email">
          <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
            One recipient per request in the MVP. The sender must be verified
            and explicitly linked to this app.
          </p>
          <Code>{`curl -X POST '${API_BASE}/email/messages' \\
  -H 'X-API-Key: rk_live_YOUR_KEY' \\
  -H 'Idempotency-Key: welcome_user_001' \\
  -H 'Content-Type: application/json' \\
  -d '{"from":"noreply@example.com","to":["user@example.com"],"subject":"Welcome","bodyText":"Hello!"}'`}</Code>
          <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">
            <code>POST /email/messages</code> requires <code>email:send</code>.
            Send text, HTML, or both. Attachments, CC/BCC, and bulk recipients
            are not available in the MVP.
          </p>
        </Card>
        <Card title="Read delivery status">
          <Code>{`GET ${API_BASE}/email/messages/em_...\nX-API-Key: rk_live_YOUR_KEY`}</Code>
          <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
            The response contains only the message ID and operational status.
            Message bodies and recipient addresses are never returned by this
            API.
          </p>
        </Card>
      </div>
    );

  if (section === "domains")
    return (
      <div className="space-y-4">
        <EmailApiDomainManager />
        <Card title="Deliverability protection">
          <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
            Hard bounces and spam complaints suppress the recipient for your
            account. A suspicious increase in either can automatically pause
            sending pending review.
          </p>
        </Card>
      </div>
    );

  if (section === "try") return <EmailApiTryIt />;

  return (
    <div className="space-y-4">
      <Card title="Get started">
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          Email API sends transactional messages from verified, app-authorized
          senders. Each account receives 1,000 free messages once. Email API
          Starter is 15,000 IQD/month for 10,000 monthly messages.
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>Verify a domain and authorize a sender for this application.</li>
          <li>
            <Link
              href={appApiKeysNew(app.appId)}
              className="font-medium underline underline-offset-2"
            >
              Create a scoped API key
            </Link>{" "}
            with <code>email:send</code>.
          </li>
          <li>Use an Idempotency-Key for every live send.</li>
          <li>
            Monitor statuses and resolve bounces before they affect
            deliverability.
          </li>
        </ol>
      </Card>
      <EmailApiSubscriptionCard />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`${base}/messages`}
          className="rounded-2xl bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-secondary)]"
        >
          <p className="text-sm font-semibold">Messages</p>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
            Send a message and read its status.
          </p>
        </Link>
        <Link
          href={`${base}/domains`}
          className="rounded-2xl bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-secondary)]"
        >
          <p className="text-sm font-semibold">Domains</p>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
            Verify and authorize your sender.
          </p>
        </Link>
      </div>
    </div>
  );
}
