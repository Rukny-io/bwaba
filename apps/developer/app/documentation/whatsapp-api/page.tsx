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
import { whatsappOverviewCopy } from '@/lib/documentation-content/whatsapp-api/overview';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappOverviewCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiOverviewPage() {
  const c = docCopy(await getCurrentLocale(), whatsappOverviewCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
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
          {c.howItWorks.afterKey}
        </p>
        <DocCallout title={c.recommendedTitle}>
          {c.recommendedBefore}{' '}
          <DocInlineCode>@rukny/whatsapp</DocInlineCode>{' '}
          {c.recommendedAfter}
        </DocCallout>
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

      <DocSection id="integration-paths" title={c.integrationPaths.title}>
        <p>{c.integrationPaths.intro}</p>
        <ul className="list-disc space-y-2 ps-5">
          {c.integrationPaths.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {item.label}
              </Link>{' '}
              {item.note}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="not-included" title={c.notIncluded.title}>
        <p>{c.notIncluded.body}</p>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/whatsapp-api/get-started',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
