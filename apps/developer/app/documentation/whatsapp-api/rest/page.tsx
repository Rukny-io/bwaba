import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappRestCopy } from '@/lib/documentation-content/whatsapp-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  MESSAGE_ENDPOINTS,
  WHATSAPP_API_PUBLIC_BASE,
  buildCurlExample,
} from '@/lib/whatsapp-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappRestCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiRestPage() {
  const c = docCopy(await getCurrentLocale(), whatsappRestCopy);
  const send = MESSAGE_ENDPOINTS.find((e) => e.id === 'sendMessage')!;

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="base" title={c.toc[0]!.label}>
        <DocCode>{WHATSAPP_API_PUBLIC_BASE}</DocCode>
      </DocSection>

      <DocSection id="auth" title={c.toc[1]!.label}>
        <p>
          {c.authBody.split('X-API-Key')[0]}
          <DocInlineCode>X-API-Key</DocInlineCode>
          {c.authBody.split('X-API-Key')[1]?.split('Content-Type: application/json')[0]}
          <DocInlineCode>Content-Type: application/json</DocInlineCode>
          {c.authBody.split('Content-Type: application/json')[1]}
        </p>
      </DocSection>

      <DocSection id="example" title={c.toc[2]!.label}>
        <DocCode>{buildCurlExample(send)}</DocCode>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/sdk',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/reference',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
