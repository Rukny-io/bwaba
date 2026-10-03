import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { formsEmbeddingCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { buildIframeEmbedCode, getPublicFormUrl } from '@/lib/forms-urls';

const EXAMPLE_SLUG = 'your-form-slug';
const EXAMPLE_IFRAME = buildIframeEmbedCode(EXAMPLE_SLUG);
const EXAMPLE_PUBLIC = getPublicFormUrl(EXAMPLE_SLUG, false);

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsEmbeddingCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsEmbeddingPage() {
  const c = docCopy(await getCurrentLocale(), formsEmbeddingCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="requirements" title={c.toc[0]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.requirements.map((item, index) => (
            <li key={item}>
              {item}
              {index === 2 ? (
                <>
                  {' '}
                  (
                  <Link
                    href="/documentation/forms/domains"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    {c.detailsLink}
                  </Link>
                  )
                </>
              ) : null}
            </li>
          ))}
        </ul>
        <DocCallout title={c.calloutTitle}>{c.calloutBody}</DocCallout>
      </DocSection>

      <DocSection id="snippet" title={c.snippetTitle}>
        <p>
          {c.snippetP1Before}{' '}
          <DocInlineCode>data-rukny-form</DocInlineCode>{' '}
          <Link
            href="/documentation/forms/events"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.snippetP1Link}
          </Link>{' '}
          {c.snippetP1After}
        </p>
        <DocCode>{EXAMPLE_IFRAME}</DocCode>
        <p>
          {c.snippetP2.split('?embed=1')[0]}
          <DocInlineCode>?embed=1</DocInlineCode>
          {c.snippetP2.split('?embed=1')[1]}
        </p>
      </DocSection>

      <DocSection id="public-link" title={c.publicTitle}>
        <p>{c.publicBody}</p>
        <DocCode>{EXAMPLE_PUBLIC}</DocCode>
      </DocSection>

      <DocSection id="troubleshooting" title={c.troubleshootingTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.troubleshooting.map((item, index) => (
            <li key={item.title}>
              <strong>{item.title}</strong>{' '}
              {index === 2 ? (
                <>
                  —{' '}
                  <Link
                    href="/documentation/forms/events"
                    className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                  >
                    {c.resizeLink}
                  </Link>
                  .
                </>
              ) : (
                item.body
              )}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/domains', label: c.prevLabel }}
        next={{ href: '/documentation/forms/events', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
