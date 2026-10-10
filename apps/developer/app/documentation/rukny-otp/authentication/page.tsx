import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocTable,
} from '@/components/documentation/docs-article';
import { ruknyOtpAuthCopy } from '@/lib/documentation-content/rukny-otp/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), ruknyOtpAuthCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function RuknyOtpAuthenticationPage() {
  const c = docCopy(await getCurrentLocale(), ruknyOtpAuthCopy);

  return (
    <DocumentationArticle
      productId="rukny-otp"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="headers" title={c.toc[0]!.label}>
        <DocTable
          headers={[...c.headers]}
          rows={c.rows.map((row) => [
            <DocInlineCode key={row[0]}>{row[0]}</DocInlineCode>,
            row[1],
            row[2],
          ])}
        />
        <DocCallout>{c.callout}</DocCallout>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/rukny-otp', label: c.prevLabel }}
        next={{
          href: '/documentation/rukny-otp/integration',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
