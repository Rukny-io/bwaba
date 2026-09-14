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
} from '@/components/documentation/docs-article';
import { buildEmbedListenerSnippet } from '@/lib/forms-urls';

export const metadata: Metadata = {
  title: 'Embed events — Forms | Rukny Documentation',
  description:
    'Listen for Rukny form postMessage events for submissions and iframe resize.',
};

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'events', label: 'Event types' },
  { id: 'snippet', label: 'Listener snippet' },
  { id: 'security', label: 'Origin checks' },
];

const LISTENER = buildEmbedListenerSnippet();

export default function FormsEventsPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Embed events"
      description="The embedded form posts window messages to the parent page. Use them to close modals, track conversions, or resize the iframe."
      toc={TOC}
    >
      <DocSection id="overview" title="Overview">
        <p>
          Messages use <DocInlineCode>event.data.type === &apos;rukny:form&apos;</DocInlineCode>.
          Add a listener on the page that hosts the iframe — the same page as
          your{' '}
          <Link
            href="/documentation/forms/embedding"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            embed snippet
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="events" title="Event types">
        <DocTable
          headers={['event', 'When', 'Useful fields']}
          rows={[
            [
              <DocInlineCode key="submitted">submitted</DocInlineCode>,
              'After a successful submission',
              <>
                <DocInlineCode>slug</DocInlineCode> and related payload fields
              </>,
            ],
            [
              <DocInlineCode key="resize">resize</DocInlineCode>,
              'When the form height changes',
              <>
                <DocInlineCode>height</DocInlineCode> (number, pixels)
              </>,
            ],
          ]}
        />
      </DocSection>

      <DocSection id="snippet" title="Listener snippet">
        <p>
          Mark your iframe with <DocInlineCode>data-rukny-form</DocInlineCode>{' '}
          so resize can target it:
        </p>
        <DocCode>{LISTENER}</DocCode>
        <DocCallout title="Tip" tone="tip">
          Connect in the portal copies this snippet for you. Keep it on every
          page that embeds the form if you rely on auto-height.
        </DocCallout>
      </DocSection>

      <DocSection id="security" title="Origin checks">
        <p>
          In production, validate <DocInlineCode>event.origin</DocInlineCode>{' '}
          against the Rukny public site origin that serves{' '}
          <DocInlineCode>/f/…</DocInlineCode> embeds. Do not trust messages from
          unexpected origins.
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/embedding', label: 'Embedding' }}
        next={{ href: '/documentation/forms/webhooks', label: 'Webhooks' }}
      />
    </DocumentationArticle>
  );
}
