import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Get started — Forms | Rukny Documentation',
  description:
    'Install Forms on your app, link a form, set your website domain, and embed it.',
};

const TOC = [
  { id: 'before-you-begin', label: 'Before you begin' },
  { id: 'setup', label: 'Setup' },
  { id: 'embed', label: 'Embed on your site' },
  { id: 'next', label: 'What next' },
];

export default function FormsGetStartedPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Get started"
      description="Go from zero to a live embedded form on your website. Linking does not require a domain — embedding does."
      toc={TOC}
    >
      <DocSection id="before-you-begin" title="Before you begin">
        <ul className="list-disc space-y-2 ps-5">
          <li>A Rukny developer account</li>
          <li>Access to the Forms product (same account)</li>
          <li>A website where you can paste an iframe snippet</li>
        </ul>
      </DocSection>

      <DocSection id="setup" title="Setup">
        <DocSteps
          steps={[
            {
              title: 'Create an app and install Forms',
              body: (
                <p>
                  Open the{' '}
                  <Link
                    href="/login?next=/apps"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    dashboard
                  </Link>
                  , select an app, then install <strong>Forms</strong> from
                  Products if it is not already installed.
                </p>
              ),
            },
            {
              title: 'Create or pick a form',
              body: (
                <p>
                  Create a form in the Forms dashboard, or use one you already
                  own. Publish it when you are ready for the public page and
                  embed.
                </p>
              ),
            },
            {
              title: 'Link the form to your app',
              body: (
                <p>
                  In the app → Forms hub, choose <strong>Link form</strong> and
                  select the form. A form can only be linked to one developer
                  app at a time.
                </p>
              ),
            },
            {
              title: 'Set your website URL',
              body: (
                <p>
                  Open Settings → Domains and add your app website URL. Rukny
                  derives the allowed embed origin from that URL. Without it,
                  Connect will show embed as blocked.
                </p>
              ),
            },
          ]}
        />
        <DocCallout title="Tip" tone="tip">
          You can link forms before the website domain is set. Domain setup only
          unlocks secure iframe embedding.
        </DocCallout>
      </DocSection>

      <DocSection id="embed" title="Embed on your site">
        <p>
          Open the linked form → <strong>Connect</strong>. Copy the iframe
          snippet, paste it into your page, and load the page from your allowed
          origin. Use the live preview in Connect to confirm the form renders.
        </p>
        <p>
          Details and edge cases:{' '}
          <Link
            href="/documentation/forms/embedding"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            Embedding
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="next" title="What next">
        <ul className="list-disc space-y-2 ps-5">
          <li>
            Add the{' '}
            <Link
              href="/documentation/forms/events"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              submission listener
            </Link>{' '}
            for in-page UX.
          </li>
          <li>
            Configure a{' '}
            <Link
              href="/documentation/forms/webhooks"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              webhook
            </Link>{' '}
            if your backend should receive answers.
          </li>
          <li>
            Read{' '}
            <Link
              href="/documentation/forms/domains"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Website domain
            </Link>{' '}
            if embeds are blocked.
          </li>
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms', label: 'Overview' }}
        next={{ href: '/documentation/forms/linking', label: 'Linking forms' }}
      />
    </DocumentationArticle>
  );
}
