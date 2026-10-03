import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { whatsappReferenceCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  MESSAGE_ENDPOINTS,
  TEMPLATE_ENDPOINTS,
} from '@/lib/whatsapp-api-catalog';
import { getWhatsappApiCopy } from '@/lib/whatsapp-api-copy';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappReferenceCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiReferencePage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, whatsappReferenceCopy);
  const d = getWhatsappApiCopy(locale);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="messages" title={c.toc[0]!.label}>
        <DocTable
          headers={[...c.tableHeaders]}
          rows={MESSAGE_ENDPOINTS.map((endpoint) => [
            endpoint.method,
            <DocInlineCode key={endpoint.id}>{endpoint.path}</DocInlineCode>,
            endpoint.scopes.join(', '),
            d[endpoint.summaryKey],
          ])}
        />
      </DocSection>

      <DocSection id="templates" title={c.toc[1]!.label}>
        <DocTable
          headers={[...c.tableHeaders]}
          rows={TEMPLATE_ENDPOINTS.map((endpoint) => [
            endpoint.method,
            <DocInlineCode key={endpoint.id}>{endpoint.path}</DocInlineCode>,
            endpoint.scopes.join(', '),
            d[endpoint.summaryKey],
          ])}
        />
      </DocSection>

      <DocSection id="openapi" title={c.toc[2]!.label}>
        <p>
          {c.openapiBody.split('packages/whatsapp/openapi/public-v1.yaml')[0]}
          <DocInlineCode>packages/whatsapp/openapi/public-v1.yaml</DocInlineCode>
          {c.openapiBody.split('packages/whatsapp/openapi/public-v1.yaml')[1]}
        </p>
        <DocCallout>{c.callout}</DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/rest',
          label: c.prevLabel,
        }}
      />
    </DocumentationArticle>
  );
}
