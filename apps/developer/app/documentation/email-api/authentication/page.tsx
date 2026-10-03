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
import { emailAuthCopy } from '@/lib/documentation-content/email-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { EMAIL_SCOPES } from '@/lib/email-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailAuthCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiAuthenticationPage() {
  const c = docCopy(await getCurrentLocale(), emailAuthCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="keys" title={c.toc[0]!.label}>
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

      <DocSection id="headers" title={c.toc[1]!.label}>
        <DocCode>{`X-API-Key: rk_live_…
Idempotency-Key: welcome_user_001   # required for POST /email/messages
Content-Type: application/json`}</DocCode>
        <p>
          {c.headersIntro.split('@rukny/email')[0]}
          <DocInlineCode>@rukny/email</DocInlineCode>
          {c.headersIntro.split('@rukny/email')[1]?.split('apiKey')[0]}
          <DocInlineCode>apiKey</DocInlineCode>
          {c.headersIntro.split('apiKey')[1]?.split('idempotencyKey')[0]}
          <DocInlineCode>idempotencyKey</DocInlineCode>
          {c.headersIntro.split('idempotencyKey')[1]?.split('send')[0]}
          <DocInlineCode>send</DocInlineCode>
          {c.headersIntro.split('send')[1]}
        </p>
      </DocSection>

      <DocSection id="scopes" title={c.toc[2]!.label}>
        <DocTable
          headers={[...c.scopeHeaders]}
          rows={EMAIL_SCOPES.map((item) => [
            <DocInlineCode key={item.scope}>{item.scope}</DocInlineCode>,
            c.scopeDescriptions[item.scope] ?? item.description,
          ])}
        />
      </DocSection>

      <DocSection id="idempotency" title={c.toc[3]!.label}>
        <p>{c.idemBody}</p>
        <ul className="list-disc space-y-2 ps-5">
          {c.idemItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="environments" title={c.toc[4]!.label}>
        <p>{c.envBody}</p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/best-practices',
          label: c.prevLabel,
        }}
        next={{ href: '/documentation/email-api/messages', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
