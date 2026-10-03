import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { whatsappMessagesCopy } from '@/lib/documentation-content/whatsapp-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { MESSAGE_ENDPOINTS, buildCurlExample } from '@/lib/whatsapp-api-catalog';
import { getWhatsappApiCopy } from '@/lib/whatsapp-api-copy';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappMessagesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiMessagesPage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, whatsappMessagesCopy);
  const d = getWhatsappApiCopy(locale);
  const send = MESSAGE_ENDPOINTS.find((e) => e.id === 'sendMessage')!;
  const get = MESSAGE_ENDPOINTS.find((e) => e.id === 'getMessage')!;

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="send" title={c.toc[0]!.label}>
        <p>
          <DocInlineCode>POST /whatsapp/messages</DocInlineCode> —{' '}
          {d[send.summaryKey]}
        </p>
        <p>
          {c.requiredScope} <DocInlineCode>whatsapp:send</DocInlineCode>
        </p>
        <DocTable
          headers={[...c.fieldHeaders]}
          rows={(send.fields ?? []).map((field) => [
            <DocInlineCode key={field.name}>{field.name}</DocInlineCode>,
            field.type,
            field.required ? c.yes : c.no,
            field.description,
          ])}
        />
        <DocCode>{buildCurlExample(send)}</DocCode>
        <p>
          {c.seeExamplesBefore}{' '}
          <Link
            href="/documentation/whatsapp-api/send"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.seeExamplesLink}
          </Link>{' '}
          {c.seeExamplesAfter}
        </p>
      </DocSection>

      <DocSection id="status" title={c.toc[1]!.label}>
        <p>
          <DocInlineCode>GET /whatsapp/messages/:id</DocInlineCode> —{' '}
          {d[get.summaryKey]}
        </p>
        <p>
          {c.requiredScope} <DocInlineCode>whatsapp:read</DocInlineCode>
        </p>
        <DocCode>{buildCurlExample(get)}</DocCode>
        {get.exampleResponse ? (
          <>
            <p>{c.responseExample}</p>
            <DocCode>{get.exampleResponse}</DocCode>
          </>
        ) : null}
      </DocSection>

      <DocSection id="types" title={c.toc[2]!.label}>
        <p>{c.typesIntro}</p>
        <ul className="list-disc space-y-2 ps-5">
          {c.types.map((item) => (
            <li key={item.title}>
              <DocInlineCode>{item.title}</DocInlineCode> — {item.body}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="window" title={c.toc[3]!.label}>
        <DocCallout title={locale === 'ar' ? 'مهم' : 'Important'} tone="warning">
          {c.windowBody}
        </DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/authentication',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/templates',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
