import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import {
  EMAIL_API_PUBLIC_BASE,
  MESSAGE_ENDPOINTS,
} from '@/lib/email-api-catalog';

export const metadata: Metadata = {
  title: 'API reference — Email API | Rukny Documentation',
  description: 'REST endpoint reference for the public Rukny Email API.',
};

const TOC = [
  { id: 'base', label: 'Base URL' },
  { id: 'auth', label: 'Auth headers' },
  { id: 'messages', label: 'Messages' },
];

export default function EmailApiReferencePage() {
  return (
    <DocumentationArticle
      title="API reference"
      description="Public endpoints you call with an API key. Domain and sender setup happen in the developer portal."
      toc={TOC}
    >
      <DocSection id="base" title="Base URL">
        <p>
          <DocInlineCode>{EMAIL_API_PUBLIC_BASE}</DocInlineCode>
        </p>
      </DocSection>

      <DocSection id="auth" title="Auth headers">
        <DocTable
          headers={['Header', 'Required', 'Notes']}
          rows={[
            [
              <DocInlineCode key="k">X-API-Key</DocInlineCode>,
              'Always',
              'rk_live_… or rk_test_…',
            ],
            [
              <DocInlineCode key="i">Idempotency-Key</DocInlineCode>,
              'When sending',
              'Required on POST /email/messages (8–128 chars)',
            ],
            [
              <DocInlineCode key="c">Content-Type</DocInlineCode>,
              'JSON bodies',
              'application/json',
            ],
          ]}
        />
      </DocSection>

      <DocSection id="messages" title="Messages">
        <DocTable
          headers={['Method', 'Path', 'Scopes', 'Summary']}
          rows={MESSAGE_ENDPOINTS.map((endpoint) => [
            endpoint.method,
            <DocInlineCode key={endpoint.id}>{endpoint.path}</DocInlineCode>,
            endpoint.scopes.join(', '),
            endpoint.summary,
          ])}
        />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/rest', label: 'REST & curl' }}
      />
    </DocumentationArticle>
  );
}
