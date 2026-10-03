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
  DocH3,
} from '@/components/documentation/docs-article';
import { emailSdkCopy } from '@/lib/documentation-content/email-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { SDK_INSTALL, SDK_QUICKSTART } from '@/lib/email-api-code-samples';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailSdkCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiSdkDocsPage() {
  const c = docCopy(await getCurrentLocale(), emailSdkCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="install" title={c.toc[0]!.label}>
        <DocCode>{SDK_INSTALL}</DocCode>
        <DocCallout title={c.serverOnlyTitle}>{c.serverOnlyBody}</DocCallout>
      </DocSection>

      <DocSection id="quickstart" title={c.toc[1]!.label}>
        <DocCode>{SDK_QUICKSTART}</DocCode>
      </DocSection>

      <DocSection id="config" title={c.toc[2]!.label}>
        <DocTable
          headers={[...c.configHeaders]}
          rows={c.configRows.map((row) => [
            <DocInlineCode key={row.opt}>{row.opt}</DocInlineCode>,
            row.required,
            row.desc,
          ])}
        />
      </DocSection>

      <DocSection id="methods" title={c.toc[3]!.label}>
        <DocH3>{c.methodsTitle}</DocH3>
        <DocTable
          headers={[...c.methodHeaders]}
          rows={c.methods.map(([method, desc]) => [
            <DocInlineCode key={method}>{method}</DocInlineCode>,
            desc,
          ])}
        />
      </DocSection>

      <DocSection id="errors" title={c.toc[4]!.label}>
        <p>
          {c.errorsBody.includes('RuknyEmailError') ? (
            <>
              {c.errorsBody.split('RuknyEmailError')[0]}
              <DocInlineCode>RuknyEmailError</DocInlineCode>
              {c.errorsBody.split('RuknyEmailError')[1]}
            </>
          ) : (
            c.errorsBody
          )}{' '}
          <Link
            href="/documentation/email-api/errors"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.prevLabel}
          </Link>
          .
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/errors', label: c.prevLabel }}
        next={{ href: '/documentation/email-api/rest', label: c.nextLabel }}
      />
    </DocumentationArticle>
  );
}
