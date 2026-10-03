import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocLinkCard,
  DocPager,
  DocSection,
  DocInlineCode,
} from '@/components/documentation/docs-article';
import { emailOverviewCopy } from '@/lib/documentation-content/email-api/overview';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailOverviewCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiOverviewPage() {
  const c = docCopy(await getCurrentLocale(), emailOverviewCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="what-you-can-build" title={c.toc[0]!.label}>
        <DocFeatureGrid items={c.features} />
      </DocSection>

      <DocSection id="how-it-works" title={c.toc[1]!.label}>
        <p>
          {c.howItWorks.beforeKey}{' '}
          <DocInlineCode>X-API-Key</DocInlineCode>
          {c.howItWorks.mid}{' '}
          <DocInlineCode>Idempotency-Key</DocInlineCode>{' '}
          {c.howItWorks.afterIdem}
        </p>
        <DocCallout title={c.recommendedTitle}>
          {c.recommendedBodyBefore}{' '}
          <DocInlineCode>@rukny/email</DocInlineCode>{' '}
          {c.recommendedBodyAfter}
        </DocCallout>
      </DocSection>

      <DocSection id="where-to-start" title={c.whereToStart.title}>
        <div className="space-y-2.5">
          <DocLinkCard
            href="/documentation/email-api/get-started"
            title={c.whereToStart.getStarted.title}
            description={c.whereToStart.getStarted.description}
          />
          <DocLinkCard
            href="/documentation/email-api/use-cases"
            title={c.whereToStart.useCases.title}
            description={c.whereToStart.useCases.description}
          />
          <DocLinkCard
            href="/documentation/email-api/send"
            title={c.whereToStart.send.title}
            description={c.whereToStart.send.description}
          />
          <DocLinkCard
            href="/documentation/email-api/sdk"
            title={c.whereToStart.sdk.title}
            description={c.whereToStart.sdk.description}
          />
          <DocLinkCard
            href="/documentation/email-api/reference"
            title={c.whereToStart.reference.title}
            description={c.whereToStart.reference.description}
          />
        </div>
      </DocSection>

      <DocSection id="integration-paths" title={c.integrationPaths.title}>
        <p>{c.integrationPaths.intro}</p>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <Link
              href="/documentation/email-api/sdk"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.integrationPaths.sdk}
            </Link>{' '}
            {c.integrationPaths.sdkNote}
          </li>
          <li>
            <Link
              href="/documentation/email-api/send"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.integrationPaths.send}
            </Link>{' '}
            {c.integrationPaths.sendNote}
          </li>
          <li>
            <Link
              href="/documentation/email-api/rest"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.integrationPaths.rest}
            </Link>{' '}
            {c.integrationPaths.restNote}
          </li>
          <li>
            <Link
              href="/login?next=/apps"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.integrationPaths.portal}
            </Link>{' '}
            {c.integrationPaths.portalNote}
          </li>
        </ul>
      </DocSection>

      <DocSection id="not-included" title={c.notIncluded.title}>
        <p>{c.notIncluded.body}</p>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/email-api/get-started',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
