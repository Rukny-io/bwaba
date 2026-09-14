import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
  DocH3,
} from '@/components/documentation/docs-article';
import { SDK_INSTALL, SDK_QUICKSTART } from '@/lib/email-api-code-samples';

export const metadata: Metadata = {
  title: 'Node.js SDK — Email API | Rukny Documentation',
  description: 'Install and use @rukny/email for server-side transactional email.',
};

const TOC = [
  { id: 'install', label: 'Install' },
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'config', label: 'Configuration' },
  { id: 'methods', label: 'Methods' },
  { id: 'errors', label: 'Errors' },
];

export default function EmailApiSdkDocsPage() {
  return (
    <DocumentationArticle
      title="Node.js SDK"
      description="@rukny/email is the recommended way to send email and check status from Node.js and TypeScript. Server-side only."
      toc={TOC}
    >
      <DocSection id="install" title="Install">
        <DocCode>{SDK_INSTALL}</DocCode>
        <DocCallout title="Server-side only">
          The package throws if it detects a browser runtime so API keys cannot
          leak to clients.
        </DocCallout>
      </DocSection>

      <DocSection id="quickstart" title="Quickstart">
        <DocCode>{SDK_QUICKSTART}</DocCode>
      </DocSection>

      <DocSection id="config" title="Configuration">
        <DocTable
          headers={['Option', 'Required', 'Description']}
          rows={[
            [
              <DocInlineCode key="k">apiKey</DocInlineCode>,
              'Yes',
              'Your rk_live_ or rk_test_ key',
            ],
            [
              <DocInlineCode key="b">baseUrl</DocInlineCode>,
              'No',
              'Defaults to https://api.rukny.io/api/v1',
            ],
            [
              <DocInlineCode key="t">timeoutMs</DocInlineCode>,
              'No',
              'Request timeout (default 30000)',
            ],
            [
              <DocInlineCode key="f">fetch</DocInlineCode>,
              'No',
              'Custom fetch implementation for tests',
            ],
          ]}
        />
      </DocSection>

      <DocSection id="methods" title="Methods">
        <DocH3>Messages</DocH3>
        <DocTable
          headers={['Method', 'Description']}
          rows={[
            [
              <DocInlineCode key="s">
                messages.send(input, {'{ idempotencyKey }'})
              </DocInlineCode>,
              'Send one transactional email',
            ],
            [
              <DocInlineCode key="g">messages.getStatus(id)</DocInlineCode>,
              'Read delivery status',
            ],
          ]}
        />
        <DocCallout>
          Verify domains and authorize senders in the{' '}
          <Link
            href="/login?next=/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            developer portal
          </Link>
          , then send with the SDK.
        </DocCallout>
      </DocSection>

      <DocSection id="errors" title="Errors">
        <p>
          Failed requests throw <DocInlineCode>RuknyEmailError</DocInlineCode>.
          See the{' '}
          <Link
            href="/documentation/email-api/errors"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Errors
          </Link>{' '}
          guide for status meanings and retry rules.
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/errors', label: 'Errors' }}
        next={{ href: '/documentation/email-api/rest', label: 'REST & curl' }}
      />
    </DocumentationArticle>
  );
}
