import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocLinkCard,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Forms | Rukny Documentation',
  description:
    'Link Rukny forms to your developer app, embed them on your website, and handle submissions.',
};

const TOC = [
  { id: 'what-you-can-build', label: 'What you can build' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'where-to-start', label: 'Where to start' },
  { id: 'not-included', label: 'What it is not' },
];

export default function FormsOverviewPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Forms"
      description="Connect forms built in Rukny Forms to your developer app, embed them securely on your website, and react when someone submits."
      toc={TOC}
    >
      <DocSection id="what-you-can-build" title="What you can build">
        <DocFeatureGrid
          items={[
            {
              title: 'On-site intake',
              description:
                'Contact, lead, waitlist, and support forms that live on your domain.',
            },
            {
              title: 'Secure embeds',
              description:
                'iframe embeds locked to your app website origin — not open to the whole web.',
            },
            {
              title: 'In-page events',
              description:
                'Listen for submit and resize postMessage events from the embed.',
            },
            {
              title: 'Server webhooks',
              description:
                'Push answers to your backend when a form is submitted.',
            },
          ]}
        />
      </DocSection>

      <DocSection id="how-it-works" title="How it works">
        <p>
          You design and publish forms in the Forms product. In the developer
          portal you install Forms on an app, link a form, set your website URL
          under Domains, then copy the iframe snippet from Connect. One form
          links to one developer app.
        </p>
        <DocCallout title="Portal-first">
          Linking, domain allowlisting, and embed snippets are managed in the
          developer dashboard — there is no public Forms REST API for embeds
          yet.
        </DocCallout>
      </DocSection>

      <DocSection id="where-to-start" title="Where to start">
        <div className="space-y-2.5">
          <DocLinkCard
            href="/documentation/forms/get-started"
            title="Get started"
            description="Install Forms, create or link a form, set your domain, and embed."
          />
          <DocLinkCard
            href="/documentation/forms/embedding"
            title="Embedding"
            description="iframe code, publish rules, and how origin checks work."
          />
          <DocLinkCard
            href="/documentation/forms/events"
            title="Embed events"
            description="postMessage events for submit and auto-resize."
          />
          <DocLinkCard
            href="/documentation/forms/webhooks"
            title="Webhooks"
            description="Send submissions to your server from Forms integrations."
          />
        </div>
      </DocSection>

      <DocSection id="not-included" title="What it is not">
        <p>
          Forms docs cover connecting and embedding forms from the developer
          portal. Form builder UX, response analytics, and team collaboration
          live in the{' '}
          <Link
            href="https://forms.rukny.io"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Forms dashboard
          </Link>
          . This is not a substitute for Email API or WhatsApp messaging.
        </p>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/forms/get-started',
          label: 'Get started',
        }}
      />
    </DocumentationArticle>
  );
}
