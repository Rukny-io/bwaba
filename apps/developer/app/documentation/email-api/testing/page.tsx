import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { emailTestingCopy } from '@/lib/documentation-content/email-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailTestingCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiTestingPage() {
  const c = docCopy(await getCurrentLocale(), emailTestingCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="modes" title={c.toc[0]!.label}>
        <DocTable
          headers={[...c.modeHeaders]}
          rows={c.modeRows.map((row, index) =>
            index === 0
              ? [
                  row[0],
                  <DocInlineCode key="t">{row[1]}</DocInlineCode>,
                  <DocInlineCode key="l">{row[2]}</DocInlineCode>,
                ]
              : row,
          )}
        />
        <DocCallout title={c.tipTitle}>
          {c.tipBody.split('process.env.RUKNY_API_KEY')[0]}
          <DocInlineCode>process.env.RUKNY_API_KEY</DocInlineCode>
          {c.tipBody.split('process.env.RUKNY_API_KEY')[1]}
        </DocCallout>
      </DocSection>

      <DocSection id="try-it" title={c.toc[1]!.label}>
        <p>{c.tryBody}</p>
        <p>
          {c.tryBeforeLink}{' '}
          <Link
            href="/login?next=/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.tryLink}
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="checklist" title={c.toc[2]!.label}>
        <DocFeatureGrid items={c.checklist} />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/domains', label: c.prevLabel }}
        next={{
          href: '/documentation/email-api/quotas',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
