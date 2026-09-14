import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Website domain — Forms | Rukny Documentation',
  description:
    'Set your app website URL so Rukny can allowlist the origin for form embeds.',
};

const TOC = [
  { id: 'why', label: 'Why it matters' },
  { id: 'setup', label: 'Set it up' },
  { id: 'checks', label: 'What gets checked' },
];

export default function FormsDomainsPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Website domain"
      description="Embeds are only allowed on the website origin configured for your developer app. This is separate from Email API domain verification."
      toc={TOC}
    >
      <DocSection id="why" title="Why it matters">
        <p>
          Without a website URL, Connect marks embedding as blocked and the
          Forms hub shows a setup strip pointing to Domains. That keeps iframes
          from being pasted onto arbitrary third-party sites.
        </p>
        <DocCallout title="Not the same as Email Domains">
          Forms uses the app <strong>website URL</strong> under Settings →
          Domains. Email API uses SPF/DKIM verification for sending mail. You
          may need both if you use both products.
        </DocCallout>
      </DocSection>

      <DocSection id="setup" title="Set it up">
        <DocSteps
          steps={[
            {
              title: 'Open Settings → Domains',
              body: (
                <p>
                  In the{' '}
                  <Link
                    href="/login?next=/apps"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    developer dashboard
                  </Link>
                  , open your app → Settings → Domains.
                </p>
              ),
            },
            {
              title: 'Enter your website URL',
              body: (
                <p>
                  Use a full URL such as{' '}
                  <DocInlineCode>https://www.example.com</DocInlineCode>. Rukny
                  stores the origin (scheme + host + port) for embed checks.
                </p>
              ),
            },
            {
              title: 'Return to Forms',
              body: (
                <p>
                  The hub strip should show your allowed domain. Open Connect
                  again — embed should unlock once the form is also published.
                </p>
              ),
            },
          ]}
        />
      </DocSection>

      <DocSection id="checks" title="What gets checked">
        <ul className="list-disc space-y-2 ps-5">
          <li>The page hosting the iframe must match the allowed origin.</li>
          <li>
            Localhost may work for development if that is the origin you
            configured — match scheme and port carefully.
          </li>
          <li>
            Changing the website URL updates the allowlist for linked forms on
            that app.
          </li>
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/linking', label: 'Linking forms' }}
        next={{ href: '/documentation/forms/embedding', label: 'Embedding' }}
      />
    </DocumentationArticle>
  );
}
