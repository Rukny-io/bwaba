import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Testing — Email API | Rukny Documentation',
  description: 'Test keys, portal Try it, and safe sandbox habits for Email API.',
};

const TOC = [
  { id: 'modes', label: 'Test vs live' },
  { id: 'try-it', label: 'Try it console' },
  { id: 'checklist', label: 'Pre-launch checklist' },
];

export default function EmailApiTestingPage() {
  return (
    <DocumentationArticle
      title="Testing"
      description="Validate your integration without emailing customers or spending live quota. Switch environments by changing the API key — not your application logic."
      toc={TOC}
    >
      <DocSection id="modes" title="Test vs live">
        <DocTable
          headers={['', 'Test', 'Live']}
          rows={[
            [
              'Key prefix',
              <DocInlineCode key="t">rk_test_</DocInlineCode>,
              <DocInlineCode key="l">rk_live_</DocInlineCode>,
            ],
            ['Recipients', 'Account email or verified domain', 'Any authorized recipient'],
            ['Quota', 'Does not consume live quota', 'Counts against plan'],
            ['Idempotency', 'Recommended', 'Required'],
          ]}
        />
        <DocCallout title="Tip">
          Keep the same code path for both environments. Load the key from{' '}
          <DocInlineCode>process.env.RUKNY_API_KEY</DocInlineCode> so staging and
          production differ only by configuration.
        </DocCallout>
      </DocSection>

      <DocSection id="try-it" title="Try it console">
        <p>
          The portal includes a Try it panel that sends with a test key on your
          behalf. Use it to confirm domain + sender setup before writing backend
          code.
        </p>
        <p>
          Open your app → Email API → Try it after{' '}
          <Link
            href="/login?next=/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            signing in
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="checklist" title="Pre-launch checklist">
        <DocFeatureGrid
          items={[
            {
              title: 'Domain verified',
              description: 'DNS records pass and status is verified.',
            },
            {
              title: 'Sender authorized',
              description: 'from address is linked to the app.',
            },
            {
              title: 'Test send works',
              description: 'SDK or Try it delivers to your account email.',
            },
            {
              title: 'Status polling works',
              description: 'getStatus returns a sensible lifecycle state.',
            },
            {
              title: 'Idempotency wired',
              description: 'Retries reuse the same business key.',
            },
            {
              title: 'Live key scoped',
              description: 'Production key has only the scopes you need.',
            },
          ]}
        />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/domains', label: 'Domains' }}
        next={{
          href: '/documentation/email-api/quotas',
          label: 'Quotas & limits',
        }}
      />
    </DocumentationArticle>
  );
}
