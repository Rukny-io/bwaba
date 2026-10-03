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
import { whatsappAuthCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { WHATSAPP_API_PUBLIC_BASE } from '@/lib/whatsapp-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappAuthCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiAuthenticationPage() {
  const c = docCopy(await getCurrentLocale(), whatsappAuthCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="base-url" title={c.toc[0]!.label}>
        <DocCode>{WHATSAPP_API_PUBLIC_BASE}</DocCode>
        <p>
          {c.baseAfter.split('/whatsapp/messages')[0]}
          <DocInlineCode>/whatsapp/messages</DocInlineCode>
          {c.baseAfter.split('/whatsapp/messages')[1]}
        </p>
      </DocSection>

      <DocSection id="keys" title={c.toc[1]!.label}>
        <p>{c.keysIntro}</p>
        <DocTable
          headers={[...c.keyHeaders]}
          rows={[
            [
              <DocInlineCode key="l">rk_live_…</DocInlineCode>,
              c.liveEnv,
              c.liveBehavior,
            ],
            [
              <DocInlineCode key="t">rk_test_…</DocInlineCode>,
              c.testEnv,
              c.testBehavior,
            ],
          ]}
        />
        <DocCallout title={c.importantTitle} tone="warning">
          {c.importantBody}
        </DocCallout>
      </DocSection>

      <DocSection id="headers" title={c.toc[2]!.label}>
        <DocCode>{`X-API-Key: rk_live_…
Content-Type: application/json`}</DocCode>
        <p>
          {c.headersIntro.split('@rukny/whatsapp')[0]}
          <DocInlineCode>@rukny/whatsapp</DocInlineCode>
          {c.headersIntro.split('@rukny/whatsapp')[1]?.split('apiKey')[0]}
          <DocInlineCode>apiKey</DocInlineCode>
          {c.headersIntro.split('apiKey')[1]}
        </p>
      </DocSection>

      <DocSection id="scopes" title={c.toc[3]!.label}>
        <DocTable
          headers={[...c.scopeHeaders]}
          rows={c.scopes.map(([scope, description]) => [
            <DocInlineCode key={scope}>{scope}</DocInlineCode>,
            description,
          ])}
        />
      </DocSection>

      <DocSection id="wallet" title={c.toc[4]!.label}>
        <p>{c.walletBody}</p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/best-practices',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/messages',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
