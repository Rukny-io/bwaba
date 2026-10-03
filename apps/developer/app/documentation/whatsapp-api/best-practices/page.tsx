import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappBestPracticesCopy } from '@/lib/documentation-content/whatsapp-api/mid-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappBestPracticesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiBestPracticesPage() {
  const c = docCopy(await getCurrentLocale(), whatsappBestPracticesCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      {c.sections.map((section) => (
        <DocSection key={section.id} id={section.id} title={section.title}>
          <p>
            {section.body.includes('X-Rukny-Signature') ? (
              <>
                {section.body.split('X-Rukny-Signature')[0]}
                <code>X-Rukny-Signature</code>
                {section.body.split('X-Rukny-Signature')[1]}
              </>
            ) : (
              section.body
            )}
          </p>
          {section.calloutTitle && section.calloutBody ? (
            <DocCallout title={section.calloutTitle} tone="warning">
              {section.calloutBody}
            </DocCallout>
          ) : null}
        </DocSection>
      ))}

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/use-cases',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/authentication',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
