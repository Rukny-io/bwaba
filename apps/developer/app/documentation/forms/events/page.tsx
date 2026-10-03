import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { formsEventsCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { buildEmbedListenerSnippet } from '@/lib/forms-urls';

const LISTENER = buildEmbedListenerSnippet();

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsEventsCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsEventsPage() {
  const c = docCopy(await getCurrentLocale(), formsEventsCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="overview" title={c.toc[0]!.label}>
        <p>
          {c.overviewBefore}{' '}
          <DocInlineCode>event.data.type === &apos;rukny:form&apos;</DocInlineCode>
          .{' '}
          <Link
            href="/documentation/forms/embedding"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.overviewLink}
          </Link>
          {c.overviewAfter}
        </p>
      </DocSection>

      <DocSection id="events" title={c.eventsTitle}>
        <DocTable
          headers={[...c.headers]}
          rows={[
            [
              <DocInlineCode key="submitted">submitted</DocInlineCode>,
              c.submittedWhen,
              <>
                <DocInlineCode>slug</DocInlineCode> {c.submittedFields}
              </>,
            ],
            [
              <DocInlineCode key="resize">resize</DocInlineCode>,
              c.resizeWhen,
              <>
                <DocInlineCode>height</DocInlineCode> {c.resizeFields}
              </>,
            ],
          ]}
        />
      </DocSection>

      <DocSection id="snippet" title={c.snippetTitle}>
        <p>
          {c.snippetIntro.split('data-rukny-form')[0]}
          <DocInlineCode>data-rukny-form</DocInlineCode>
          {c.snippetIntro.split('data-rukny-form')[1]}
        </p>
        <DocCode>{LISTENER}</DocCode>
        <DocCallout title={c.tipTitle} tone="tip">
          {c.tipBody}
        </DocCallout>
      </DocSection>

      <DocSection id="security" title={c.securityTitle}>
        <p>
          {c.securityBody.includes('event.origin') ? (
            <>
              {c.securityBody.split('event.origin')[0]}
              <DocInlineCode>event.origin</DocInlineCode>
              {c.securityBody.split('event.origin')[1]?.split('/f/…')[0]}
              <DocInlineCode>/f/…</DocInlineCode>
              {c.securityBody.split('/f/…')[1]}
            </>
          ) : (
            c.securityBody
          )}
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/embedding', label: c.prevLabel }}
        next={{ href: '/documentation/forms/webhooks', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
