import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { whatsappTemplatesCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  TEMPLATE_ENDPOINTS,
  buildCurlExample,
} from '@/lib/whatsapp-api-catalog';
import { getWhatsappApiCopy } from '@/lib/whatsapp-api-copy';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappTemplatesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiTemplatesPage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, whatsappTemplatesCopy);
  const d = getWhatsappApiCopy(locale);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="overview" title={c.toc[0]!.label}>
        <p>
          {c.overviewBody.split('APPROVED')[0]}
          <DocInlineCode>APPROVED</DocInlineCode>
          {c.overviewBody.split('APPROVED')[1]}
        </p>
        <DocCallout>{c.callout}</DocCallout>
      </DocSection>

      <DocSection id="endpoints" title={c.toc[1]!.label}>
        <DocTable
          headers={[...c.endpointHeaders]}
          rows={TEMPLATE_ENDPOINTS.map((endpoint) => [
            endpoint.method,
            <DocInlineCode key={endpoint.id}>{endpoint.path}</DocInlineCode>,
            d[endpoint.summaryKey],
          ])}
        />
        <p>{c.createExample}</p>
        <DocCode>
          {buildCurlExample(
            TEMPLATE_ENDPOINTS.find((e) => e.id === 'createTemplate')!,
          )}
        </DocCode>
      </DocSection>

      <DocSection id="categories" title={c.toc[2]!.label}>
        <DocTable headers={[...c.categoryHeaders]} rows={c.categories} />
      </DocSection>

      <DocSection id="sync" title={c.toc[3]!.label}>
        <p>{c.syncBody}</p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/messages',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/webhooks',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
