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
  title: 'Quotas & limits — Email API | Rukny Documentation',
  description: 'Free allowance, Starter plan, and MVP payload limits for Email API.',
};

const TOC = [
  { id: 'plans', label: 'Plans' },
  { id: 'mvp', label: 'MVP limits' },
  { id: 'exceeded', label: 'When quota is exceeded' },
];

export default function EmailApiQuotasPage() {
  return (
    <DocumentationArticle
      title="Quotas & limits"
      description="Understand free allowance, paid capacity, and the payload constraints of the current MVP."
      toc={TOC}
    >
      <DocSection id="plans" title="Plans">
        <DocTable
          headers={['Plan', 'Volume', 'Notes']}
          rows={[
            ['Free allowance', '1,000 messages', 'One-time per account'],
            [
              'Email API Starter',
              '10,000 / month',
              '6,000 IQD per month — request from the portal',
            ],
          ]}
        />
        <p>
          Usage and plan status appear on the Email API overview card in the
          dashboard. Full public pricing for the developer platform lives on{' '}
          <Link
            href="/pricing"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            /pricing
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="mvp" title="MVP limits">
        <DocFeatureGrid
          items={[
            {
              title: 'One recipient',
              description: 'to accepts exactly one address per request.',
            },
            {
              title: 'Text and/or HTML',
              description:
                'Provide bodyText, bodyHtml, or both — no attachments.',
            },
            {
              title: 'Optional reply-to',
              description: 'At most one replyTo address.',
            },
            {
              title: 'Subject rules',
              description: 'Required, max 255 chars, no newline characters.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="exceeded" title="When quota is exceeded">
        <p>
          Live sends return <DocInlineCode>403 Forbidden</DocInlineCode> when
          quota is exhausted. Upgrade or wait for the next billing cycle before
          retrying. Test keys are not blocked by live quota.
        </p>
        <DocCallout>
          Rate limits may also return <DocInlineCode>429</DocInlineCode>. Back
          off exponentially and keep using the same idempotency key for the
          original business event.
        </DocCallout>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/testing', label: 'Testing' }}
        next={{ href: '/documentation/email-api/errors', label: 'Errors' }}
      />
    </DocumentationArticle>
  );
}
