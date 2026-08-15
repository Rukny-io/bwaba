'use client';

import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { SEND_MESSAGE_RECIPES } from '@/lib/whatsapp-api-code-samples';
import { WhatsappApiCodePanel } from '@/components/whatsapp-api/whatsapp-api-code-panel';

export function WhatsappApiSdks() {
  const d = WHATSAPP_API_COPY;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.sdksTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.sdksDesc}
        </p>
        <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] p-4" dir="ltr">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            npm
          </p>
          <code className="mt-2 block font-mono text-[13px] text-[var(--foreground)]">
            npm install @rukny/whatsapp
          </code>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksQuickstartTitle}</h3>
        <pre
          className="mt-4 overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 text-[12px] leading-relaxed text-[var(--foreground)]"
          dir="ltr"
        >
          <code>{`import { RuknyWhatsApp } from '@rukny/whatsapp';

const wa = new RuknyWhatsApp({
  apiKey: process.env.RUKNY_API_KEY!,
});

// Text
await wa.messages.sendText({
  to: '+9647xxxxxxxxx',
  body: 'Hello from Rukny!',
});

// Template with variables
await wa.messages.sendTemplate({
  to: '+9647xxxxxxxxx',
  name: 'order_confirmation',
  language: 'ar',
  variables: ['Ahmed', '#12345'],
});

// OTP (AUTHENTICATION template)
await wa.messages.sendOtp({
  to: '+9647xxxxxxxxx',
  code: '483920',
  template: 'otp_verify',
  language: 'ar',
});

// List approved templates
const templates = await wa.templates.list();

// Verify inbound webhook (Node.js)
import { verifyWebhookSignature } from '@rukny/whatsapp';`}</code>
        </pre>
        <p className="mt-3 text-[12.5px] text-[var(--muted-foreground)]">
          {d.sdksOtpEnvHint}
        </p>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksMethodsTitle}</h3>
        <ul className="mt-3 space-y-2 text-[13px] text-[var(--muted-foreground)]" dir="ltr">
          <li>
            <code className="text-[var(--foreground)]">messages.sendText()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">messages.sendTemplate()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">messages.sendOtp()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">messages.getStatus()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">templates.list()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">templates.get(name)</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">verifyWebhookSignature()</code>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksExamplesTitle}</h3>
        <div className="mt-4">
          <WhatsappApiCodePanel recipes={SEND_MESSAGE_RECIPES} copyLabel={d.copy} />
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksOpenApiTitle}</h3>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">{d.sdksOpenApiDesc}</p>
        <code
          className="mt-3 block break-all rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[12px] text-[var(--foreground)]"
          dir="ltr"
        >
          packages/whatsapp/openapi/public-v1.yaml
        </code>
      </section>
    </div>
  );
}
