import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocCode,
  DocH3,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { ruknyOtpIntegrationCopy } from '@/lib/documentation-content/rukny-otp/pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { RUKNY_OTP_PUBLIC_BASE } from '@/lib/rukny-otp-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), ruknyOtpIntegrationCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function RuknyOtpIntegrationPage() {
  const c = docCopy(await getCurrentLocale(), ruknyOtpIntegrationCopy);

  return (
    <DocumentationArticle
      productId="rukny-otp"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="env" title={c.envTitle}>
        <p>{c.envIntro}</p>
        <DocCode>{`RUKNY_API_KEY=rk_live_…
RUKNY_API_BASE=${RUKNY_OTP_PUBLIC_BASE}`}</DocCode>
      </DocSection>

      <DocSection id="server" title={c.serverTitle}>
        <p>{c.serverIntro}</p>
        <ul className="mt-4 space-y-3">
          {c.serverPaths.map((item) => (
            <li key={item.path} className="text-[15px] leading-7">
              <span className="font-medium text-[var(--foreground)]">
                {item.label}
              </span>
              <br />
              <DocInlineCode>{item.path}</DocInlineCode>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="flow" title={c.flowTitle}>
        <ol className="list-decimal space-y-2 ps-5">
          {c.flowSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="never" title={c.neverTitle}>
        <DocH3>{c.neverTitle}</DocH3>
        <ul className="list-disc space-y-2 ps-5">
          {c.neverItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/rukny-otp/authentication',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/rukny-otp/reference',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
