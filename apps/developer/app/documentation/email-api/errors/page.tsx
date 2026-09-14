import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { EMAIL_ERROR_CATALOG } from '@/lib/email-api-catalog';

export const metadata: Metadata = {
  title: 'Errors — Email API | Rukny Documentation',
  description: 'HTTP status codes and SDK error handling for the Email API.',
};

const TOC = [
  { id: 'http', label: 'HTTP status codes' },
  { id: 'common', label: 'Common causes' },
  { id: 'sdk', label: 'SDK errors' },
];

export default function EmailApiErrorsDocsPage() {
  return (
    <DocumentationArticle
      title="Errors"
      description="Failures use standard HTTP status codes. The Node SDK surfaces them as RuknyEmailError with status and body."
      toc={TOC}
    >
      <DocSection id="http" title="HTTP status codes">
        <DocTable
          headers={['Status', 'Code', 'Description']}
          rows={EMAIL_ERROR_CATALOG.map((item) => [
            <DocInlineCode key={item.status}>{String(item.status)}</DocInlineCode>,
            item.code,
            item.description,
          ])}
        />
      </DocSection>

      <DocSection id="common" title="Common causes">
        <DocTable
          headers={['Symptom', 'Likely fix']}
          rows={[
            [
              '403 sender not authorized',
              'Verify domain, then authorize the from address for this app.',
            ],
            [
              '403 product not installed',
              'Install Email API on the app that owns the API key.',
            ],
            [
              '403 recipient suppressed',
              'Remove the address from suppression only if bounce was a mistake.',
            ],
            [
              '400 missing Idempotency-Key',
              'Send an 8–128 character key on every live POST.',
            ],
            [
              '403 quota exceeded',
              'Upgrade plan or wait for the next cycle. Use test keys meanwhile.',
            ],
          ]}
        />
      </DocSection>

      <DocSection id="sdk" title="SDK errors">
        <DocCode>{`import { RuknyEmail, RuknyEmailError } from '@rukny/email';

const email = new RuknyEmail({ apiKey: process.env.RUKNY_API_KEY! });

try {
  await email.messages.send(
    {
      from: 'noreply@yourdomain.com',
      to: 'user@example.com',
      subject: 'Welcome',
      bodyText: 'Hello!',
    },
    { idempotencyKey: 'welcome_001' },
  );
} catch (error) {
  if (error instanceof RuknyEmailError) {
    console.error(error.status, error.message, error.body);
  }
  throw error;
}`}</DocCode>
        <p>
          Retry <DocInlineCode>429</DocInlineCode> and{' '}
          <DocInlineCode>5xx</DocInlineCode> with backoff. Fix the request for{' '}
          <DocInlineCode>4xx</DocInlineCode> before retrying with a new
          idempotency key only when the business event itself is new.
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/quotas',
          label: 'Quotas & limits',
        }}
        next={{ href: '/documentation/email-api/sdk', label: 'Node.js SDK' }}
      />
    </DocumentationArticle>
  );
}
