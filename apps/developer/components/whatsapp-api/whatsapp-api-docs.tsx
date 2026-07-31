'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { CodeSnippetCard } from '@/components/forms/code-snippet-card';
import { appApiKeysNew, appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

type DocTab = 'quickstart' | 'reference' | 'webhooks' | 'errors';

const API_BASE = 'https://api.rukny.io/v1';

export function WhatsappApiDocs() {
  const d = useTranslations().whatsappApi;
  const { app } = useCurrentApp();
  const [tab, setTab] = useState<DocTab>('quickstart');

  const sendExample = `curl -X POST ${API_BASE}/whatsapp/messages \\
  -H "X-API-Key: rk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+9647xxxxxxxxx",
    "type": "text",
    "text": { "body": "مرحباً من Rukny!" }
  }'`;

  const templatesExample = `curl ${API_BASE}/whatsapp/templates \\
  -H "X-API-Key: rk_live_YOUR_KEY"`;

  const webhookVerify = `const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}`;

  const tabs: { id: DocTab; label: string }[] = [
    { id: 'quickstart', label: d.navQuickstart },
    { id: 'reference', label: d.navReference },
    { id: 'webhooks', label: d.navWebhooks },
    { id: 'errors', label: d.navErrors },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {d.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{d.subtitle}</p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors',
              tab === t.id
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'quickstart' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:rounded-3xl">
            <h2 className="text-sm font-semibold">{d.quickstartTitle}</h2>
            <ol className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
              <li className="flex flex-wrap items-center gap-1">
                <span>①</span>
                <Link href={appWhatsapp(app.appId)} className="font-medium text-[var(--primary)]">
                  WhatsApp Business
                </Link>
              </li>
              <li className="flex flex-wrap items-center gap-1">
                <span>②</span>
                <Link
                  href={appApiKeysNew(app.appId)}
                  className="font-medium text-[var(--primary)]"
                >
                  {d.createKey}
                </Link>
              </li>
              <li>{d.quickstartStep3}</li>
            </ol>
          </section>
          <CodeSnippetCard
            title={d.authTitle}
            description={d.authDesc}
            code={`X-API-Key: rk_live_xxxxxxxxxxxxxxxx`}
            copyLabel={d.copy}
            language="url"
          />
          <CodeSnippetCard
            title={d.sendMessageTitle}
            code={sendExample}
            copyLabel={d.copy}
            language="javascript"
          />
        </div>
      )}

      {tab === 'reference' && (
        <div className="space-y-4">
          <CodeSnippetCard
            title="POST /v1/whatsapp/messages"
            description="Scopes: whatsapp:send"
            code={sendExample}
            copyLabel={d.copy}
            language="javascript"
          />
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm sm:rounded-3xl">
            <h3 className="font-semibold">Request body</h3>
            <ul className="mt-2 space-y-1 font-mono text-xs text-[var(--muted-foreground)]" dir="ltr">
              <li>to — E.164 recipient</li>
              <li>type — text | template | image | …</li>
              <li>phoneNumberId — optional sender phone</li>
              <li>text.body — for type=text</li>
              <li>template — for type=template</li>
            </ul>
          </section>
          <CodeSnippetCard
            title="GET /v1/whatsapp/templates"
            description="Scopes: templates:read"
            code={templatesExample}
            copyLabel={d.copy}
            language="javascript"
          />
          <p className="text-xs text-[var(--muted-foreground)]">{d.mediaComingSoon}</p>
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:rounded-3xl">
            <h2 className="text-sm font-semibold">{d.webhooksTitle}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{d.webhooksDesc}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{d.webhookSignature}</p>
          </section>
          <CodeSnippetCard
            title="Verify signature (Node.js)"
            code={webhookVerify}
            copyLabel={d.copy}
            language="javascript"
          />
        </div>
      )}

      {tab === 'errors' && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:rounded-3xl">
          <h2 className="text-sm font-semibold">{d.errorsTitle}</h2>
          <ul className="mt-3 space-y-3 text-sm text-[var(--muted-foreground)]">
            <li>{d.errorNoWallet}</li>
            <li>{d.errorNoWaba}</li>
            <li>{d.errorTemplate}</li>
            <li>{d.errorPhone}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
