import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { formsDomainsCopy } from '@/lib/documentation-content/forms/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), formsDomainsCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function FormsDomainsPage() {
  const c = docCopy(await getCurrentLocale(), formsDomainsCopy);
  const steps = c.steps.map((step, index) => ({
    title: step.title,
    body:
      index === 1 ? (
        <p>
          {step.body.split('https://www.example.com')[0]}
          <DocInlineCode>https://www.example.com</DocInlineCode>
          {step.body.split('https://www.example.com')[1]}
        </p>
      ) : (
        <p>{step.body}</p>
      ),
  }));

  return (
    <DocumentationArticle
      productId="forms"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="why" title={c.toc[0]!.label}>
        <p>{c.whyBody}</p>
        <DocCallout title={c.calloutTitle}>{c.calloutBody}</DocCallout>
      </DocSection>

      <DocSection id="setup" title={c.setupTitle}>
        <DocSteps steps={steps} />
      </DocSection>

      <DocSection id="checks" title={c.checksTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.checks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/forms/linking', label: c.prevLabel }}
        next={{ href: '/documentation/forms/embedding', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
