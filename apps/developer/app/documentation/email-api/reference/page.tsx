import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { emailReferenceCopy } from '@/lib/documentation-content/email-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  EMAIL_API_PUBLIC_BASE,
  MESSAGE_ENDPOINTS,
} from '@/lib/email-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailReferenceCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiReferencePage() {
  const c = docCopy(await getCurrentLocale(), emailReferenceCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="base" title={c.toc[0]!.label}>
        <p>
          <DocInlineCode>{EMAIL_API_PUBLIC_BASE}</DocInlineCode>
        </p>
      </DocSection>

      <DocSection id="auth" title={c.toc[1]!.label}>
        <DocTable
          headers={[...c.headersAuth]}
          rows={[
            [
              <DocInlineCode key="k">X-API-Key</DocInlineCode>,
              c.authRows[0]!.required,
              c.authRows[0]!.notes,
            ],
            [
              <DocInlineCode key="i">Idempotency-Key</DocInlineCode>,
              c.authRows[1]!.required,
              c.authRows[1]!.notes,
            ],
            [
              <DocInlineCode key="c">Content-Type</DocInlineCode>,
              c.authRows[2]!.required,
              c.authRows[2]!.notes,
            ],
          ]}
        />
      </DocSection>

      <DocSection id="messages" title={c.toc[2]!.label}>
        <DocTable
          headers={[...c.headersMessages]}
          rows={MESSAGE_ENDPOINTS.map((endpoint) => [
            endpoint.method,
            <DocInlineCode key={endpoint.id}>{endpoint.path}</DocInlineCode>,
            endpoint.scopes.join(', '),
            c.summaries[endpoint.id] ?? endpoint.summary,
          ])}
        />
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/rest', label: c.prevLabel }}
      />
    </DocumentationArticle>
  );
}
