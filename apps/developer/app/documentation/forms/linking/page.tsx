import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { formsLinkingCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsLinkingCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsLinkingPage() {
  const c = docCopy(await getCurrentLocale(), formsLinkingCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="why" title={c.toc[0]!.label}>
        <p>{c.why}</p>
      </DocSection>

      <DocSection id="how" title={c.howTitle}>
        <ol className="list-decimal space-y-2 ps-5">
          {c.howSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <DocCallout title={c.calloutTitle}>{c.calloutBody}</DocCallout>
      </DocSection>

      <DocSection id="rules" title={c.rulesTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.rules.map((rule, index) => (
            <li key={rule}>
              {rule}
              {index === 2 ? (
                <>
                  {' '}
                  <Link
                    href="/documentation/forms/domains"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    {c.domainLink}
                  </Link>
                  .
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="unlink" title={c.unlinkTitle}>
        <p>{c.unlinkBody}</p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/get-started', label: c.prevLabel }}
        next={{ href: '/documentation/forms/domains', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
