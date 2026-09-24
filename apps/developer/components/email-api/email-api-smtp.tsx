'use client';

import Link from 'next/link';
import { DocCodeBlock } from '@/components/documentation/doc-code-block';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

const SMTP_HOST = process.env.NEXT_PUBLIC_DEVELOPER_SMTP_HOST || 'smtp.rukny.io';
const SMTP_USER = process.env.NEXT_PUBLIC_DEVELOPER_SMTP_USERNAME || 'rukny';

export function EmailApiSmtp() {
  const d = EMAIL_API_COPY;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.smtpTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.smtpDesc}
        </p>
        <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
          <div>
            <dt className="font-medium text-[var(--foreground)]">Host</dt>
            <dd className="mt-0.5 font-mono text-[var(--muted-foreground)]">{SMTP_HOST}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--foreground)]">Port</dt>
            <dd className="mt-0.5 font-mono text-[var(--muted-foreground)]">
              587 (STARTTLS) or 465 (SMTPS)
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--foreground)]">Username</dt>
            <dd className="mt-0.5 font-mono text-[var(--muted-foreground)]">{SMTP_USER}</dd>
          </div>
          <div>
            <dt className="font-medium text-[var(--foreground)]">Password</dt>
            <dd className="mt-0.5 text-[var(--muted-foreground)]">
              Your API key (rk_live_… or rk_test_…)
            </dd>
          </div>
        </dl>
        <Link
          href={`${DOCUMENTATION_BASE}/email-api/send/smtp`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          {d.smtpDocsLink}
        </Link>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {d.smtpNodemailerTitle}
        </h3>
        <div className="mt-3">
          <DocCodeBlock
            language="javascript"
            filename="send.js"
            code={`import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '${SMTP_HOST}',
  port: 587,
  secure: false,
  auth: {
    user: '${SMTP_USER}',
    pass: process.env.RUKNY_API_KEY,
  },
});

await transporter.sendMail({
  from: 'noreply@yourdomain.com',
  to: 'user@example.com',
  subject: 'Hello from SMTP',
  html: '<p>It works!</p>',
});`}
          />
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          {d.smtpLaravelTitle}
        </h3>
        <div className="mt-3">
          <DocCodeBlock
            language="ini"
            filename=".env"
            code={`MAIL_MAILER=smtp
MAIL_HOST=${SMTP_HOST}
MAIL_PORT=587
MAIL_USERNAME=${SMTP_USER}
MAIL_PASSWORD=rk_live_your_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com`}
          />
        </div>
      </section>
    </div>
  );
}
