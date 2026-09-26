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
  description: 'Free tier, Pro/Scale plans, overage packs, and MVP payload limits for Email API.',
};

const TOC = [
  { id: 'plans', label: 'Plans' },
  { id: 'overage', label: 'Overage' },
  { id: 'marketing', label: 'Marketing & automations' },
  { id: 'mvp', label: 'MVP limits' },
  { id: 'exceeded', label: 'When quota is exceeded' },
];

export default function EmailApiQuotasPage() {
  return (
    <DocumentationArticle
      title="Quotas & limits"
      description="Understand free tier, paid capacity, overage packs, and the payload constraints of the current MVP."
      toc={TOC}
    >
      <DocSection id="plans" title="Transactional plans">
        <DocTable
          headers={['Plan', 'Volume', 'Price (IQD/mo)', 'Notes']}
          rows={[
            ['Free', '3,000 / month', '0', '100 emails / day cap · 3 domains'],
            ['Pro 10K', '10,000 / month', '5,000', 'Self-serve request'],
            ['Pro 50K', '50,000 / month', '16,000', ''],
            ['Pro 100K', '100,000 / month', '28,000', ''],
            ['Scale 100K', '100,000 / month', '72,000', ''],
            ['Scale 200K', '200,000 / month', '125,000', ''],
            ['Scale 500K', '500,000 / month', '275,000', ''],
            ['Scale 1M', '1,000,000 / month', '500,000', ''],
            ['Scale 1.5M', '1,500,000 / month', '660,000', ''],
            ['Scale 2.5M', '2,500,000 / month', '920,000', ''],
          ]}
        />
        <p>
          Usage and plan status appear on the Email API overview card in the
          dashboard. Full public pricing lives on{' '}
          <a
            href="https://mail.rukny.io/pricing"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            mail.rukny.io/pricing
          </a>{' '}
          and{' '}
          <Link
            href="/pricing/compare-resend"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            /pricing/compare-resend
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="overage" title="Overage packs">
        <p>
          When your included monthly quota is exhausted on a paid plan, purchase
          prepaid packs from the subscription card:{' '}
          <strong>1,000 emails for 700 IQD</strong>. Packs are billed from your
          developer wallet.
        </p>
      </DocSection>

      <DocSection id="marketing" title="Marketing & automations">
        <DocTable
          headers={['Product', 'Free tier', 'Paid from']}
          rows={[
            ['Marketing contacts', '1,000 contacts', '35,000 IQD / mo (5K contacts)'],
            ['Automations', '10,000 runs / month', '2 IQD / run overage'],
            ['Add-on: +100 domains', '—', '20,000 IQD / mo'],
            ['Add-on: Dedicated IP', '—', '30,000 IQD / mo'],
            ['Add-on: SSO', '—', '120,000 IQD / mo'],
          ]}
        />
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
          Live sends return <DocInlineCode>402 Payment Required</DocInlineCode>{' '}
          with code <DocInlineCode>quota_exceeded</DocInlineCode> when quota is
          exhausted. Upgrade, buy an overage pack, or wait for the next billing
          cycle before retrying. Test keys are not blocked by live quota.
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
