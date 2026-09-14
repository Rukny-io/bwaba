import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocH3,
} from '@/components/documentation/docs-article';
import { EmailApiCodePanel } from '@/components/email-api/email-api-code-panel';
import { MESSAGE_ENDPOINTS } from '@/lib/email-api-catalog';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';
import { EMAIL_API_PUBLIC_BASE } from '@/lib/email-api-catalog';

export const metadata: Metadata = {
  title: 'REST & curl — Email API | Rukny Documentation',
  description:
    'Call the Email API with curl, fetch, Python requests, or any HTTPS client.',
};

const TOC = [
  { id: 'base', label: 'Base URL' },
  { id: 'send', label: 'Send with curl / Node / Python' },
  { id: 'status', label: 'Check status' },
  { id: 'when', label: 'When to use REST' },
];

export default function EmailApiRestPage() {
  const status = MESSAGE_ENDPOINTS[1];

  return (
    <DocumentationArticle
      title="REST & curl"
      description="Use plain HTTPS if you are not on Node.js. The same endpoints power the SDK — headers and bodies are identical."
      toc={TOC}
    >
      <DocSection id="base" title="Base URL">
        <p>
          <DocInlineCode>{EMAIL_API_PUBLIC_BASE}</DocInlineCode>
        </p>
        <DocCallout>
          Prefer the{' '}
          <Link
            href="/documentation/email-api/sdk"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Node.js SDK
          </Link>{' '}
          when you can. REST is ideal for Go, PHP, Ruby, Python, and shell
          scripts.
        </DocCallout>
      </DocSection>

      <DocSection id="send" title="Send with curl / Node / Python">
        <p>
          Switch languages in the panel. The SDK tab shows the equivalent{' '}
          <DocInlineCode>@rukny/email</DocInlineCode> call.
        </p>
        <EmailApiCodePanel
          recipes={SEND_EMAIL_RECIPES}
          defaultLanguage="curl"
        />
      </DocSection>

      <DocSection id="status" title="Check status">
        <EmailApiCodePanel endpoint={status} defaultLanguage="curl" />
      </DocSection>

      <DocSection id="when" title="When to use REST">
        <DocH3>Good fit</DocH3>
        <ul className="list-disc space-y-2 ps-5">
          <li>Non-Node backends</li>
          <li>One-off scripts and ops runbooks</li>
          <li>Quick debugging with curl</li>
        </ul>
        <DocH3>Prefer the SDK when</DocH3>
        <ul className="list-disc space-y-2 ps-5">
          <li>You already run Node or TypeScript</li>
          <li>You want typed inputs and <DocInlineCode>RuknyEmailError</DocInlineCode></li>
          <li>You want idempotency headers handled for you</li>
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/sdk', label: 'Node.js SDK' }}
        next={{
          href: '/documentation/email-api/reference',
          label: 'API reference',
        }}
      />
    </DocumentationArticle>
  );
}
