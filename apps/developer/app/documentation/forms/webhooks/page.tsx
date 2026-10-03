import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { formsWebhooksCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsWebhooksCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsWebhooksPage() {
  const c = docCopy(await getCurrentLocale(), formsWebhooksCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="when" title={c.toc[0]!.label}>
        <p>
          {c.whenBefore}{' '}
          <Link
            href="/documentation/forms/events"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.whenLink}
          </Link>{' '}
          {c.whenAfter}
        </p>
      </DocSection>

      <DocSection id="setup" title={c.setupTitle}>
        <DocSteps
          steps={c.steps.map((step) => ({
            title: step.title,
            body: <p>{step.body}</p>,
          }))}
        />
        <DocCallout title={c.securityTitle}>{c.securityBody}</DocCallout>
      </DocSection>

      <DocSection id="portal" title={c.portalTitle}>
        <p>{c.portalBody}</p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/events', label: c.prevLabel }}
      />
    </DocumentationArticle>
  );
}
