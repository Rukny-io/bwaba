import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { SDK_INSTALL, SDK_QUICKSTART } from '@/lib/email-api-code-samples';

export const metadata: Metadata = {
  title: 'Get started — Email API | Rukny Documentation',
  description: 'Verify a domain, create an API key, and send your first email with Rukny.',
};

const TOC = [
  { id: 'before-you-begin', label: 'Before you begin' },
  { id: 'setup', label: 'Setup' },
  { id: 'send', label: 'Send your first email' },
  { id: 'verify', label: 'Verify delivery' },
  { id: 'next', label: 'What next' },
];

export default function EmailApiGetStartedPage() {
  return (
    <DocumentationArticle
      title="Get started"
      description="Go from zero to a delivered transactional email in a few steps. Start in test mode, then switch to live when DNS and senders are ready."
      toc={TOC}
    >
      <DocSection id="before-you-begin" title="Before you begin">
        <ul className="list-disc space-y-2 ps-5">
          <li>A Rukny developer account</li>
          <li>Permission to edit DNS for your sending domain</li>
          <li>A server environment where you can keep API keys private</li>
        </ul>
      </DocSection>

      <DocSection id="setup" title="Setup">
        <DocSteps
          steps={[
            {
              title: 'Create an app and install Email API',
              body: (
                <p>
                  Open the{' '}
                  <Link
                    href="/login?next=/apps"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    dashboard
                  </Link>
                  , create or select an app, then install <strong>Email API</strong>{' '}
                  from Products.
                </p>
              ),
            },
            {
              title: 'Verify your domain',
              body: (
                <p>
                  In Email API → Domains, add your domain and publish the DNS
                  records shown (SPF / DKIM). Refresh until the domain is
                  verified.
                </p>
              ),
            },
            {
              title: 'Authorize a sender',
              body: (
                <p>
                  Authorize an address on that domain, for example{' '}
                  <DocInlineCode>noreply@yourdomain.com</DocInlineCode>. Only
                  authorized senders can appear in <DocInlineCode>from</DocInlineCode>.
                </p>
              ),
            },
            {
              title: 'Create an API key',
              body: (
                <p>
                  Create a key with at least <DocInlineCode>email:send</DocInlineCode>.
                  Add <DocInlineCode>email:read</DocInlineCode> if you will poll
                  delivery status. Start with a <DocInlineCode>rk_test_</DocInlineCode>{' '}
                  key.
                </p>
              ),
            },
          ]}
        />
        <DocCallout title="Tip" tone="tip">
          Test keys can only send to your account email or an address on a
          verified domain you own. That keeps sandbox traffic safe while you
          wire your backend.
        </DocCallout>
      </DocSection>

      <DocSection id="send" title="Send your first email">
        <p>Install the SDK and send from your server:</p>
        <DocCode>{SDK_INSTALL}</DocCode>
        <DocCode>{SDK_QUICKSTART}</DocCode>
        <p>
          Prefer curl or fetch? See{' '}
          <Link
            href="/documentation/email-api/rest"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            REST & curl
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="verify" title="Verify delivery">
        <p>
          Check the message status with{' '}
          <DocInlineCode>messages.getStatus(id)</DocInlineCode> using the id
          returned from send. Status values move through queued → sent →
          delivered (or bounced / complained).
        </p>
        <p>
          You can also use the portal <strong>Try it</strong> console before
          wiring production traffic.
        </p>
      </DocSection>

      <DocSection id="next" title="What next">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            Read{' '}
            <Link
              href="/documentation/email-api/authentication"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Authentication
            </Link>{' '}
            for scopes and idempotency rules.
          </li>
          <li>
            Browse{' '}
            <Link
              href="/documentation/email-api/use-cases"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Use cases
            </Link>{' '}
            for OTP and receipt recipes.
          </li>
          <li>
            Follow{' '}
            <Link
              href="/documentation/email-api/best-practices"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Best practices
            </Link>{' '}
            before going live.
          </li>
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api', label: 'Overview' }}
        next={{
          href: '/documentation/email-api/use-cases',
          label: 'Use cases',
        }}
      />
    </DocumentationArticle>
  );
}
