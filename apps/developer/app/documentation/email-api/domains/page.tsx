import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocInlineCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Domains — Email API | Rukny Documentation',
  description:
    'Verify your sending domain and authorize sender addresses in the Rukny developer portal.',
};

const TOC = [
  { id: 'why', label: 'Why domains matter' },
  { id: 'flow', label: 'Setup in the portal' },
  { id: 'senders', label: 'Authorize senders' },
  { id: 'deliverability', label: 'Deliverability' },
];

export default function EmailApiDomainsDocsPage() {
  return (
    <DocumentationArticle
      title="Domains"
      description="Prove you own the domain you send from, then authorize the exact addresses your app may use. Do this in the developer portal — not with hand-written REST calls."
      toc={TOC}
    >
      <DocSection id="why" title="Why domains matter">
        <p>
          Inbox providers trust mail that passes SPF and DKIM from a domain you
          control. Until verification succeeds, live sending from that domain is
          blocked.
        </p>
      </DocSection>

      <DocSection id="flow" title="Setup in the portal">
        <DocSteps
          steps={[
            {
              title: 'Open Domains',
              body: (
                <p>
                  Sign in to the{' '}
                  <Link
                    href="/login?next=/apps"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    developer dashboard
                  </Link>
                  , open your app → Email API → Domains.
                </p>
              ),
            },
            {
              title: 'Add your domain',
              body: (
                <p>
                  Enter a domain you control (for example{' '}
                  <DocInlineCode>yourdomain.com</DocInlineCode>) and start
                  verification.
                </p>
              ),
            },
            {
              title: 'Publish DNS records',
              body: (
                <p>
                  Copy the SPF / DKIM records shown in the portal into your DNS
                  host. Propagation can take a few minutes to several hours.
                </p>
              ),
            },
            {
              title: 'Refresh until verified',
              body: (
                <p>
                  Use Refresh in the Domains UI until the domain status is
                  verified.
                </p>
              ),
            },
          ]}
        />
        <DocCallout title="Portal only">
          Domain verification and sender authorization are managed in the
          dashboard with your login session. Public API keys are for sending
          messages and reading delivery status.
        </DocCallout>
      </DocSection>

      <DocSection id="senders" title="Authorize senders">
        <p>
          After the domain is verified, authorize a sender such as{' '}
          <DocInlineCode>noreply@yourdomain.com</DocInlineCode> for the app.
          Only authorized addresses may appear in{' '}
          <DocInlineCode>from</DocInlineCode> when you send.
        </p>
      </DocSection>

      <DocSection id="deliverability" title="Deliverability">
        <DocFeatureGrid
          items={[
            {
              title: 'Hard bounces',
              description:
                'Invalid recipients are suppressed for your account automatically.',
            },
            {
              title: 'Complaints',
              description:
                'Spam complaints suppress the address and protect your reputation.',
            },
            {
              title: 'Sudden spikes',
              description:
                'A suspicious rise in bounces or complaints can pause sending for review.',
            },
          ]}
        />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/messages', label: 'Messages' }}
        next={{ href: '/documentation/email-api/testing', label: 'Testing' }}
      />
    </DocumentationArticle>
  );
}
