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
import { formsOverviewCopy } from '@/lib/documentation-content/forms/overview';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsOverviewCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsOverviewPage() {
  const c = docCopy(await getCurrentLocale(), formsOverviewCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="what-you-can-build" title={c.toc[0]!.label}>
        <DocFeatureGrid items={c.features} />
      </DocSection>

      <DocSection id="how-it-works" title={c.howItWorks.title}>
        <p>{c.howItWorks.body}</p>
        <DocCallout title={c.calloutTitle}>{c.calloutBody}</DocCallout>
      </DocSection>

      <DocSection id="where-to-start" title={c.whereToStart.title}>
        <div className="space-y-2.5">
          {c.whereToStart.cards.map((card) => (
            <DocLinkCard
              key={card.href}
              href={card.href}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
      </DocSection>

      <DocSection id="not-included" title={c.notIncluded.title}>
        <p>
          {c.notIncluded.beforeLink}{' '}
          <Link
            href="https://forms.rukny.io"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {c.notIncluded.linkLabel}
          </Link>
          {c.notIncluded.afterLink}
        </p>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/forms/get-started',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
