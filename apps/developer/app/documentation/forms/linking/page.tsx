import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';

export const metadata: Metadata = {
  title: 'Linking forms — Forms | Rukny Documentation',
  description:
    'How linking a Rukny form to a developer app works, and what blocks linking.',
};

const TOC = [
  { id: 'why', label: 'Why link' },
  { id: 'how', label: 'How to link' },
  { id: 'rules', label: 'Rules' },
  { id: 'unlink', label: 'Unlink' },
];

export default function FormsLinkingPage() {
  return (
    <DocumentationArticle
      productId="forms"
      title="Linking forms"
      description="Linking attaches a form you own to one developer app so you can manage embed settings and snippets from that app."
      toc={TOC}
    >
      <DocSection id="why" title="Why link">
        <p>
          Linking scopes the form to your app: Connect snippets, embed readiness,
          and the Forms hub list all live under that app. Without a link, the
          form still works in Forms — it just is not wired into the developer
          portal.
        </p>
      </DocSection>

      <DocSection id="how" title="How to link">
        <ol className="list-decimal space-y-2 ps-5">
          <li>
            Open your app →{' '}
            <Link
              href="/login?next=/apps"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Forms
            </Link>
            .
          </li>
          <li>
            Choose <strong>Link form</strong>.
          </li>
          <li>Select a form that is not linked elsewhere.</li>
          <li>
            Open <strong>Connect</strong> when you are ready to embed.
          </li>
        </ol>
        <DocCallout title="Create from the hub">
          <strong>Create form</strong> opens the Forms builder with your app id
          so you can return and link after publishing.
        </DocCallout>
      </DocSection>

      <DocSection id="rules" title="Rules">
        <ul className="list-disc space-y-2 ps-5">
          <li>You can only link forms you own (or can manage).</li>
          <li>A form can be linked to only one developer app at a time.</li>
          <li>
            Linking does not require a website domain — embedding does. See{' '}
            <Link
              href="/documentation/forms/domains"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Website domain
            </Link>
            .
          </li>
          <li>
            Draft forms can be linked, but they must be published before the
            public page and embed are ready.
          </li>
        </ul>
      </DocSection>

      <DocSection id="unlink" title="Unlink">
        <p>
          Unlink from the Forms hub when you want to move the form to another
          app or stop embedding under this app. Unlinking does not delete the
          form or its responses in Forms.
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/get-started', label: 'Get started' }}
        next={{
          href: '/documentation/forms/domains',
          label: 'Website domain',
        }}
      />
    </DocumentationArticle>
  );
}
