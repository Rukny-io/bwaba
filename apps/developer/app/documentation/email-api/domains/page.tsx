import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocFeatureGrid,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { emailDomainsCopy } from '@/lib/documentation-content/email-api/final-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailDomainsCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiDomainsDocsPage() {
  const c = docCopy(await getCurrentLocale(), emailDomainsCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="why" title={c.toc[0]!.label}>
        <p>{c.whyBody}</p>
      </DocSection>

      <DocSection id="flow" title={c.toc[1]!.label}>
        <DocSteps
          steps={c.steps.map((step) => ({
            title: step.title,
            body: <p>{step.body}</p>,
          }))}
        />
        <DocCallout title={c.portalTitle}>{c.portalBody}</DocCallout>
      </DocSection>

      <DocSection id="senders" title={c.toc[2]!.label}>
        <p>{c.sendersBody}</p>
      </DocSection>

      <DocSection id="deliverability" title={c.toc[3]!.label}>
        <DocFeatureGrid items={c.deliverability} />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/messages', label: c.prevLabel }}
        next={{ href: '/documentation/email-api/testing', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
