import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Best practices — Email API | Rukny Documentation',
  description:
    'Deliverability, security, and reliability guidance for the Rukny Email API.',
};

const TOC = [
  { id: 'deliverability', label: 'Deliverability' },
  { id: 'security', label: 'Security' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'content', label: 'Content' },
  { id: 'ops', label: 'Operations' },
];

export default function EmailApiBestPracticesPage() {
  return (
    <DocumentationArticle
      title="Best practices"
      description="Keep mail landing in the inbox, protect your keys, and make retries safe. These habits matter more than fancy templates."
      toc={TOC}
    >
      <DocSection id="deliverability" title="Deliverability">
        <DocFeatureGrid
          items={[
            {
              title: 'Verify DNS fully',
              description:
                'Publish every SPF and DKIM record before sending live traffic.',
            },
            {
              title: 'Use a real domain',
              description:
                'Send from your brand domain, not free mailbox providers.',
            },
            {
              title: 'Stay transactional',
              description:
                'Avoid promotional blasts on this API — it is built for 1:1 mail.',
            },
            {
              title: 'Respect suppressions',
              description:
                'Hard bounces and complaints suppress recipients automatically.',
            },
          ]}
        />
        <DocCallout>
          A sudden spike in bounces or complaints can pause sending for review.
          Fix list quality before retrying volume.
        </DocCallout>
      </DocSection>

      <DocSection id="security" title="Security">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            Keep keys on the server only — never in browsers, mobile apps, or
            public repos.
          </li>
          <li>
            Prefer scoped keys (<DocInlineCode>email:send</DocInlineCode> only
            where possible).
          </li>
          <li>Rotate keys on a schedule and after any suspected leak.</li>
          <li>Use separate keys for staging and production.</li>
        </ul>
      </DocSection>

      <DocSection id="reliability" title="Reliability">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            Always send an <DocInlineCode>Idempotency-Key</DocInlineCode> for live
            messages.
          </li>
          <li>
            Retry on network failures and{' '}
            <DocInlineCode>5xx</DocInlineCode> with exponential backoff.
          </li>
          <li>
            Treat <DocInlineCode>4xx</DocInlineCode> as permanent for that request
            body — fix the payload before retrying.
          </li>
          <li>Store the returned message id with your business event.</li>
        </ul>
      </DocSection>

      <DocSection id="content" title="Content">
        <ul className="list-disc space-y-2 ps-5">
          <li>Keep subjects short and specific — no newlines.</li>
          <li>Include a plain-text body even when you send HTML.</li>
          <li>One clear action per email when possible.</li>
          <li>
            MVP limit: one recipient, no attachments, no CC/BCC.
          </li>
        </ul>
      </DocSection>

      <DocSection id="ops" title="Operations">
        <p>
          Monitor{' '}
          <Link
            href="/documentation/email-api/quotas"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            quotas
          </Link>{' '}
          and switch from test to live only after DNS + sender authorization are
          green. Use the portal Domains UI for day-to-day DNS checks, and the
          API for automation.
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/use-cases',
          label: 'Use cases',
        }}
        next={{
          href: '/documentation/email-api/authentication',
          label: 'Authentication',
        }}
      />
    </DocumentationArticle>
  );
}
