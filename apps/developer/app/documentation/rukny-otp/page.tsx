import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { ruknyOtpOverviewCopy } from '@/lib/documentation-content/rukny-otp/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), ruknyOtpOverviewCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function RuknyOtpDocsOverviewPage() {
  const c = docCopy(await getCurrentLocale(), ruknyOtpOverviewCopy);

  return (
    <DocumentationArticle
      productId="rukny-otp"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="portal" title={c.portalTitle}>
        <p>{c.portalBody}</p>
      </DocSection>

      <DocSection id="docs" title={c.toc[1]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          <li>
            <Link
              href="/documentation/rukny-otp/reference"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.portalReference}
            </Link>
          </li>
          <li>
            <Link
              href="/documentation/rukny-otp/integration"
              className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              {c.portalIntegration}
            </Link>
          </li>
        </ul>
      </DocSection>

      <DocPager
        next={{
          href: '/documentation/rukny-otp/authentication',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
