import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
  DocH3,
} from '@/components/documentation/docs-article';
import { EmailApiCodePanel } from '@/components/email-api/email-api-code-panel';
import { MESSAGE_ENDPOINTS } from '@/lib/email-api-catalog';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';

export const metadata: Metadata = {
  title: 'Messages — Email API | Rukny Documentation',
  description: 'Send transactional email and read delivery status with Rukny Email API.',
};

const TOC = [
  { id: 'send', label: 'Send' },
  { id: 'fields', label: 'Fields' },
  { id: 'status', label: 'Status' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'limits', label: 'Limits' },
];

export default function EmailApiMessagesDocsPage() {
  const send = MESSAGE_ENDPOINTS[0];
  const status = MESSAGE_ENDPOINTS[1];

  return (
    <DocumentationArticle
      title="Messages"
      description="Send one transactional email per request, then poll its operational status. Bodies and recipient addresses are never returned by the status endpoint."
      toc={TOC}
    >
      <DocSection id="send" title="Send a message">
        <p>
          <DocInlineCode>
            {send.method} {send.path}
          </DocInlineCode>{' '}
          · scope <DocInlineCode>email:send</DocInlineCode>
        </p>
        <p>{send.summary}</p>
        <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES} />
      </DocSection>

      <DocSection id="fields" title="Request fields">
        <DocTable
          headers={['Field', 'Type', 'Required', 'Notes']}
          rows={(send.fields ?? []).map((field) => [
            <DocInlineCode key={field.name}>{field.name}</DocInlineCode>,
            field.type,
            field.required ? 'Yes' : 'No',
            field.description,
          ])}
        />
      </DocSection>

      <DocSection id="status" title="Read delivery status">
        <p>
          <DocInlineCode>
            {status.method} {status.path}
          </DocInlineCode>{' '}
          · scope <DocInlineCode>email:read</DocInlineCode>
        </p>
        <p>{status.summary}</p>
        <EmailApiCodePanel endpoint={status} defaultLanguage="sdk" />
      </DocSection>

      <DocSection id="lifecycle" title="Status lifecycle">
        <DocTable
          headers={['Status', 'Meaning']}
          rows={[
            [<DocInlineCode key="q">queued</DocInlineCode>, 'Accepted and waiting for the provider'],
            [<DocInlineCode key="s">sent</DocInlineCode>, 'Handed off to the email provider'],
            [
              <DocInlineCode key="d">delivered</DocInlineCode>,
              'Provider reported successful delivery',
            ],
            [
              <DocInlineCode key="b">bounced</DocInlineCode>,
              'Hard bounce — recipient may be suppressed',
            ],
            [
              <DocInlineCode key="c">complained</DocInlineCode>,
              'Marked as spam — recipient suppressed',
            ],
            [
              <DocInlineCode key="f">failed</DocInlineCode>,
              'Could not be sent (validation or provider error)',
            ],
          ]}
        />
        <DocH3>What status does not include</DocH3>
        <p>
          For privacy, status responses never include the subject, body, or full
          recipient address — only the message id, status, and timestamps.
        </p>
      </DocSection>

      <DocSection id="limits" title="MVP limits">
        <DocCallout>
          One recipient per request. No attachments, CC, or BCC yet. The{' '}
          <DocInlineCode>from</DocInlineCode> address must be verified and
          authorized for the app that owns the API key.
        </DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/authentication',
          label: 'Authentication',
        }}
        next={{ href: '/documentation/email-api/domains', label: 'Domains' }}
      />
    </DocumentationArticle>
  );
}
