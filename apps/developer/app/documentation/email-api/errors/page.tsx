import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { emailErrorsCopy } from '@/lib/documentation-content/email-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { EMAIL_ERROR_CATALOG } from '@/lib/email-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailErrorsCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiErrorsDocsPage() {
  const c = docCopy(await getCurrentLocale(), emailErrorsCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="http" title={c.toc[0]!.label}>
        <DocTable
          headers={[...c.httpHeaders]}
          rows={EMAIL_ERROR_CATALOG.map((item) => [
            <DocInlineCode key={item.status}>{String(item.status)}</DocInlineCode>,
            item.code,
            c.errorDescriptions[item.status] ?? item.description,
          ])}
        />
      </DocSection>

      <DocSection id="common" title={c.toc[1]!.label}>
        <DocTable headers={[...c.commonHeaders]} rows={c.commonRows} />
      </DocSection>

      <DocSection id="sdk" title={c.toc[2]!.label}>
        <DocCode>{`import { RuknyEmail, RuknyEmailError } from '@rukny/email';

const email = new RuknyEmail({ apiKey: process.env.RUKNY_API_KEY! });

try {
  await email.messages.send(
    {
      from: 'noreply@yourdomain.com',
      to: 'user@example.com',
      subject: 'Welcome',
      bodyText: 'Hello!',
    },
    { idempotencyKey: 'welcome_001' },
  );
} catch (error) {
  if (error instanceof RuknyEmailError) {
    console.error(error.status, error.message, error.body);
  }
  throw error;
}`}</DocCode>
        <p>
          {c.sdkBody.includes('429') ? (
            <>
              {c.sdkBody.split('429')[0]}
              <DocInlineCode>429</DocInlineCode>
              {c.sdkBody.split('429')[1]?.split('5xx')[0]}
              <DocInlineCode>5xx</DocInlineCode>
              {c.sdkBody.split('5xx')[1]?.split('4xx')[0]}
              <DocInlineCode>4xx</DocInlineCode>
              {c.sdkBody.split('4xx')[1]}
            </>
          ) : (
            c.sdkBody
          )}
        </p>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/quotas',
          label: c.prevLabel,
        }}
        next={{ href: '/documentation/email-api/sdk', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
