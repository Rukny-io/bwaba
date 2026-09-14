import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { EMAIL_SCOPES } from '@/lib/email-api-catalog';

export const metadata: Metadata = {
  title: 'Authentication — Email API | Rukny Documentation',
  description: 'API keys, scopes, and idempotency for the Rukny Email API.',
};

const TOC = [
  { id: 'keys', label: 'API keys' },
  { id: 'headers', label: 'Headers' },
  { id: 'scopes', label: 'Scopes' },
  { id: 'idempotency', label: 'Idempotency' },
  { id: 'environments', label: 'Environments' },
];

export default function EmailApiAuthenticationPage() {
  return (
    <DocumentationArticle
      title="Authentication"
      description="Every request authenticates with an app-scoped API key. Live sends also require an idempotency key so retries stay safe."
      toc={TOC}
    >
      <DocSection id="keys" title="API keys">
        <p>
          Create keys in the developer dashboard. The prefix tells you which
          environment you are in:
        </p>
        <DocTable
          headers={['Prefix', 'Environment', 'Behavior']}
          rows={[
            [
              <DocInlineCode key="l">rk_live_…</DocInlineCode>,
              'Live',
              'Counts against quota. Sends to real recipients.',
            ],
            [
              <DocInlineCode key="t">rk_test_…</DocInlineCode>,
              'Test',
              'Can only deliver to your account email or an address on a verified domain you own.',
            ],
          ]}
        />
        <DocCallout title="Important" tone="warning">
          Never expose keys in browsers, mobile apps, or client-side bundles.
          The Node SDK refuses to run in the browser for this reason.
        </DocCallout>
      </DocSection>

      <DocSection id="headers" title="Required headers">
        <DocCode>{`X-API-Key: rk_live_…
Idempotency-Key: welcome_user_001   # required for POST /email/messages
Content-Type: application/json`}</DocCode>
        <p>
          With <DocInlineCode>@rukny/email</DocInlineCode>, pass{' '}
          <DocInlineCode>apiKey</DocInlineCode> in the constructor and{' '}
          <DocInlineCode>idempotencyKey</DocInlineCode> on each{' '}
          <DocInlineCode>send</DocInlineCode> call — headers are set for you.
        </p>
      </DocSection>

      <DocSection id="scopes" title="Scopes">
        <DocTable
          headers={['Scope', 'Description']}
          rows={EMAIL_SCOPES.map((item) => [
            <DocInlineCode key={item.scope}>{item.scope}</DocInlineCode>,
            item.description,
          ])}
        />
      </DocSection>

      <DocSection id="idempotency" title="Idempotency">
        <p>
          Idempotency keys must be 8–128 characters: letters, numbers, hyphens,
          or underscores. Reusing a key with the same API key returns the
          original result instead of creating another send.
        </p>
        <ul className="list-disc space-y-2 ps-5">
          <li>Use a new key for each distinct business event.</li>
          <li>Reuse the same key when retrying the same event after a timeout.</li>
          <li>
            Good examples:{' '}
            <DocInlineCode>order_98421_receipt</DocInlineCode>,{' '}
            <DocInlineCode>otp_user42_v3</DocInlineCode>
          </li>
        </ul>
      </DocSection>

      <DocSection id="environments" title="Environments">
        <p>
          Keep separate keys for staging and production. Test mode validates
          your integration without spending quota or emailing customers. Switch
          to live only after domain verification and sender authorization
          succeed.
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/best-practices',
          label: 'Best practices',
        }}
        next={{ href: '/documentation/email-api/messages', label: 'Messages' }}
      />
    </DocumentationArticle>
  );
}
