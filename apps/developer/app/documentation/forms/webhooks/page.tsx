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
  title: 'Webhooks — Forms | Rukny Documentation',
  description:
    'Receive form submissions on your server via webhooks configured in Forms.',
};

const TOC = [
  { id: 'when', label: 'When to use webhooks' },
  { id: 'setup', label: 'Setup' },
  { id: 'portal', label: 'In the developer portal' },
];

export default function FormsWebhooksPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Webhooks"
      description="Push each submission to your backend. Webhooks are configured in the Forms product integrations — the developer Connect page only surfaces status."
      toc={TOC}
    >
      <DocSection id="when" title="When to use webhooks">
        <p>
          Use a webhook when your server must store answers, sync a CRM, or
          trigger workflows. Prefer{' '}
          <Link
            href="/documentation/forms/events"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            embed events
          </Link>{' '}
          for lightweight UI updates in the browser.
        </p>
      </DocSection>

      <DocSection id="setup" title="Setup">
        <DocSteps
          steps={[
            {
              title: 'Open form integrations',
              body: (
                <p>
                  In the{' '}
                  <Link
                    href="https://forms.rukny.io"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Forms dashboard
                  </Link>
                  , open the form → Integrations (or use Configure webhook from
                  Connect in the developer portal).
                </p>
              ),
            },
            {
              title: 'Add your HTTPS endpoint',
              body: (
                <p>
                  Provide a URL your server can receive. Verify the payload and
                  authenticate the request according to the Forms integration
                  settings.
                </p>
              ),
            },
            {
              title: 'Submit a test response',
              body: (
                <p>
                  Send a test submission and confirm your endpoint receives it
                  before going live.
                </p>
              ),
            },
          ]}
        />
        <DocCallout title="Security">
          Keep webhook URLs private. Prefer HTTPS, reject unexpected payloads,
          and avoid exposing internal networks (SSRF-safe receivers).
        </DocCallout>
      </DocSection>

      <DocSection id="portal" title="In the developer portal">
        <p>
          On Connect, if a webhook is already enabled you will see the URL
          (truncated when long). If not, the page links out to Forms integrations
          to configure one. Linking or unlinking the form in the developer app
          does not remove webhook settings in Forms.
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/events', label: 'Embed events' }}
      />
    </DocumentationArticle>
  );
}
