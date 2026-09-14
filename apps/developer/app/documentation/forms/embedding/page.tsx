import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { buildIframeEmbedCode, getPublicFormUrl } from '@/lib/forms-urls';

export const metadata: Metadata = {
  title: 'Embedding — Forms | Rukny Documentation',
  description:
    'Embed a linked Rukny form on your website with a secure iframe snippet.',
};

const TOC = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'snippet', label: 'iframe snippet' },
  { id: 'public-link', label: 'Public link' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

const EXAMPLE_SLUG = 'your-form-slug';
const EXAMPLE_IFRAME = buildIframeEmbedCode(EXAMPLE_SLUG);
const EXAMPLE_PUBLIC = getPublicFormUrl(EXAMPLE_SLUG, false);

export default function FormsEmbeddingPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Embedding"
      description="Paste the Connect iframe onto your site. Embedding requires a published form and your app website origin."
      toc={TOC}
    >
      <DocSection id="requirements" title="Requirements">
        <ul className="list-disc space-y-2 ps-5">
          <li>Form linked to your developer app</li>
          <li>Form status is published</li>
          <li>
            Website URL set under Settings → Domains (
            <Link
              href="/documentation/forms/domains"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              details
            </Link>
            )
          </li>
        </ul>
        <DocCallout title="Connect panel">
          Open app → Forms → <strong>Connect</strong> for a live preview and
          copy buttons. Prefer that snippet over typing URLs by hand.
        </DocCallout>
      </DocSection>

      <DocSection id="snippet" title="iframe snippet">
        <p>
          Use <DocInlineCode>data-rukny-form</DocInlineCode> so the{' '}
          <Link
            href="/documentation/forms/events"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            event listener
          </Link>{' '}
          can find the frame for auto-resize. Replace the slug with yours:
        </p>
        <DocCode>{EXAMPLE_IFRAME}</DocCode>
        <p>
          The embed URL includes <DocInlineCode>?embed=1</DocInlineCode> so the
          form renders in embed mode (chrome suited for iframes).
        </p>
      </DocSection>

      <DocSection id="public-link" title="Public link">
        <p>
          Every form also has a standalone public page (no iframe). Share it
          when you do not need an on-site embed:
        </p>
        <DocCode>{EXAMPLE_PUBLIC}</DocCode>
      </DocSection>

      <DocSection id="troubleshooting" title="Troubleshooting">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <strong>Embed blocked / no preview</strong> — set the website URL,
            then publish the form.
          </li>
          <li>
            <strong>Blank frame on your site</strong> — confirm the page origin
            matches the configured website origin (scheme, host, port).
          </li>
          <li>
            <strong>Wrong height</strong> — add the{' '}
            <Link
              href="/documentation/forms/events"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              resize listener
            </Link>
            .
          </li>
        </ul>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/forms/domains',
          label: 'Website domain',
        }}
        next={{ href: '/documentation/forms/events', label: 'Embed events' }}
      />
    </DocumentationArticle>
  );
}
