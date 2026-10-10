import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCode,
  DocH3,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { ruknyOtpRestCopy } from '@/lib/documentation-content/rukny-otp/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { buildRuknyOtpCurlExample } from '@/lib/rukny-otp-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), ruknyOtpRestCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function RuknyOtpRestPage() {
  const c = docCopy(await getCurrentLocale(), ruknyOtpRestCopy);

  return (
    <DocumentationArticle
      productId="rukny-otp"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="curl" title={c.curlTitle}>
        <DocCode>{buildRuknyOtpCurlExample()}</DocCode>
      </DocSection>

      <DocSection id="node" title={c.nodeTitle}>
        <DocH3>{c.nodeTitle}</DocH3>
        <DocCode language="ts">{c.nodeSample}</DocCode>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/rukny-otp/reference',
          label: c.prevLabel,
        }}
      />
    </DocumentationArticle>
  );
}
