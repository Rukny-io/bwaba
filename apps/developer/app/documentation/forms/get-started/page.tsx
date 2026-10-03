import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { formsGetStartedCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsGetStartedCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsGetStartedPage() {
  const c = docCopy(await getCurrentLocale(), formsGetStartedCopy);

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="before-you-begin" title={c.toc[0]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.beforeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="setup" title={c.setupTitle}>
        <DocSteps
          steps={c.steps.map((step) => ({
            title: step.title,
            body: <p>{step.body}</p>,
          }))}
        />
        <DocCallout title={c.tipTitle} tone="tip">
          {c.tipBody}
        </DocCallout>
      </DocSection>

      <DocSection id="embed" title={c.embedTitle}>
        <p>{c.embedP1}</p>
        <p>
          {c.embedP2Before}{' '}
          <Link
            href="/documentation/forms/embedding"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.embedLink}
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="next" title={c.nextTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.nextItems.map((item) => (
            <li key={item.href}>
              {item.before}{' '}
              <Link
                href={item.href}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {item.link}
              </Link>{' '}
              {item.after}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms', label: c.prevLabel }}
        next={{ href: '/documentation/forms/linking', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
