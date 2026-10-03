import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { whatsappErrorsPageCopy } from '@/lib/documentation-content/whatsapp-api/mid-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { COMMON_ERRORS } from '@/lib/whatsapp-api-catalog';
import { getWhatsappApiCopy } from '@/lib/whatsapp-api-copy';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappErrorsPageCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiErrorsPage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, whatsappErrorsPageCopy);
  const d = getWhatsappApiCopy(locale);
  const errorCopy: Record<string, string> = {
    errorUnauthorized: d.errorUnauthorized,
    errorForbidden: d.errorForbidden,
    errorNoWallet: d.errorNoWallet,
    errorNoWaba: d.errorNoWaba,
    errorTemplate: d.errorTemplate,
    errorPhone: d.errorPhone,
  };

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="common" title={c.toc[0]!.label}>
        <DocTable
          headers={[...c.headers]}
          rows={COMMON_ERRORS.map((item) => [
            <DocInlineCode key={item.code}>{item.code}</DocInlineCode>,
            errorCopy[item.key] ?? item.key,
          ])}
        />
      </DocSection>

      <DocSection id="meta" title={c.toc[1]!.label}>
        <p>{c.metaBody}</p>
        <DocCallout>{c.callout}</DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/webhooks',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/send',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
