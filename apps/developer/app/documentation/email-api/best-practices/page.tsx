import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { emailBestPracticesCopy } from '@/lib/documentation-content/email-api/final-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailBestPracticesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiBestPracticesPage() {
  const c = docCopy(await getCurrentLocale(), emailBestPracticesCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="deliverability" title={c.toc[0]!.label}>
        <DocFeatureGrid items={c.deliverability} />
        <DocCallout>{c.deliverCallout}</DocCallout>
      </DocSection>

      <DocSection id="security" title={c.toc[1]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.securityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="reliability" title={c.toc[2]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.reliabilityItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="content" title={c.toc[3]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.contentItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="ops" title={c.toc[4]!.label}>
        <p>
          {c.opsBefore}{' '}
          <Link
            href="/documentation/email-api/quotas"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.opsLink}
          </Link>{' '}
          {c.opsAfter}
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/use-cases',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/email-api/authentication',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
