import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { ruknyOtpReferenceCopy } from '@/lib/documentation-content/rukny-otp/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  RUKNY_OTP_ENDPOINTS,
  RUKNY_OTP_EXAMPLE_BODY,
  RUKNY_OTP_PUBLIC_BASE,
} from '@/lib/rukny-otp-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), ruknyOtpReferenceCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function RuknyOtpReferencePage() {
  const c = docCopy(await getCurrentLocale(), ruknyOtpReferenceCopy);
  const send = RUKNY_OTP_ENDPOINTS[0]!;

  return (
    <DocumentationArticle
      productId="rukny-otp"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="base" title={c.toc[0]!.label}>
        <p>
          <DocInlineCode>{RUKNY_OTP_PUBLIC_BASE}</DocInlineCode>
        </p>
      </DocSection>

      <DocSection id="send" title={c.toc[1]!.label}>
        <DocTable
          headers={[...c.headersEndpoint]}
          rows={[
            [
              send.method,
              <DocInlineCode key="path">{send.path}</DocInlineCode>,
              <DocInlineCode key="auth">X-API-Key</DocInlineCode>,
              c.sendSummary,
            ],
          ]}
        />
      </DocSection>

      <DocSection id="body" title={c.toc[2]!.label}>
        <DocTable
          headers={[...c.bodyHeaders]}
          rows={c.bodyRows.map((row) => [
            <DocInlineCode key={row[0]}>{row[0]}</DocInlineCode>,
            row[1],
            row[2],
          ])}
        />
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 font-mono text-[13px] leading-relaxed" dir="ltr">
          {RUKNY_OTP_EXAMPLE_BODY}
        </pre>
      </DocSection>

      <DocSection id="response" title={c.responseTitle}>
        <p>{c.responseBody}</p>
      </DocSection>

      <DocSection id="errors" title={c.errorsTitle}>
        <DocTable
          headers={['HTTP', 'Meaning']}
          rows={c.errorRows.map((row) => [
            <DocInlineCode key={row[0]}>{row[0]}</DocInlineCode>,
            row[1],
          ])}
        />
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/rukny-otp/integration',
          label: c.prevLabel,
        }}
        next={{ href: '/documentation/rukny-otp/rest', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
