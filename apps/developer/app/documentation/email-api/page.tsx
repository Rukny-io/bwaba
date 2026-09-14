import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocLinkCard,
  DocPager,
  DocSection,
  DocInlineCode,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Email API | Rukny Documentation',
  description:
    'Send transactional email from verified domains with the Rukny Email API and @rukny/email.',
};

const TOC = [
  { id: 'what-you-can-build', label: 'What you can build' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'where-to-start', label: 'Where to start' },
  { id: 'integration-paths', label: 'Integration paths' },
  { id: 'not-included', label: 'What it is not' },
];

export default function EmailApiOverviewPage() {
  return (
    <DocumentationArticle
      title="Email API"
      description="Send reliable transactional email from your backend — OTPs, magic links, receipts, and product alerts — using verified domains and app-scoped API keys."
      toc={TOC}
    >
      <DocSection id="what-you-can-build" title="What you can build">
        <DocFeatureGrid
          items={[
            {
              title: 'Authentication mail',
              description: 'One-time codes, password resets, and sign-in links.',
            },
            {
              title: 'Lifecycle alerts',
              description: 'Welcome notes, order updates, and delivery notices.',
            },
            {
              title: 'Product notifications',
              description: 'Account changes, billing receipts, and security alerts.',
            },
            {
              title: 'Safe testing',
              description:
                'Test keys limited to your account email or verified domains.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="how-it-works" title="How it works">
        <p>
          Each app installs Email API, verifies a sending domain, authorizes a
          sender address, then calls the API with an{' '}
          <DocInlineCode>X-API-Key</DocInlineCode>. Every live send needs an{' '}
          <DocInlineCode>Idempotency-Key</DocInlineCode> so retries never
          duplicate messages or billing.
        </p>
        <DocCallout title="Recommended">
          Use the official Node package <DocInlineCode>@rukny/email</DocInlineCode>{' '}
          on your server. It handles headers, typing, and errors for you.
        </DocCallout>
      </DocSection>

      <DocSection id="where-to-start" title="Where to start">
        <div className="space-y-2.5">
          <DocLinkCard
            href="/documentation/email-api/get-started"
            title="Get started"
            description="Install the product, verify DNS, create a key, and send your first email."
          />
          <DocLinkCard
            href="/documentation/email-api/use-cases"
            title="Use cases"
            description="Copy-ready patterns for OTP, receipts, and magic links."
          />
          <DocLinkCard
            href="/documentation/email-api/sdk"
            title="Node.js SDK"
            description="Install @rukny/email and ship with a few lines of TypeScript."
          />
          <DocLinkCard
            href="/documentation/email-api/reference"
            title="API reference"
            description="Methods, paths, scopes, and response shapes."
          />
        </div>
      </DocSection>

      <DocSection id="integration-paths" title="Integration paths">
        <p>Pick the path that fits your stack:</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <Link
              href="/documentation/email-api/sdk"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Node.js SDK
            </Link>{' '}
            — preferred for TypeScript and Node backends.
          </li>
          <li>
            <Link
              href="/documentation/email-api/rest"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              REST & curl
            </Link>{' '}
            — any language that can make HTTPS requests.
          </li>
          <li>
            <Link
              href="/login?next=/apps"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Portal Try it
            </Link>{' '}
            — send a safe test message without writing code first.
          </li>
        </ul>
      </DocSection>

      <DocSection id="not-included" title="What it is not">
        <p>
          Email API is not a mailbox, inbox, or marketing campaign tool. For a
          full mailbox experience use Rukny Mail. For bulk marketing or
          attachments, wait for later API releases — the MVP focuses on one
          recipient, text/HTML bodies, and high deliverability.
        </p>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/email-api/get-started',
          label: 'Get started',
        }}
      />
    </DocumentationArticle>
  );
}
