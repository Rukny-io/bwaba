import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocInlineCode,
  DocPager,
  DocSection,
  DocH3,
} from '@/components/documentation/docs-article';
import { EmailApiCodePanel } from '@/components/email-api/email-api-code-panel';
import { emailRestCopy } from '@/lib/documentation-content/email-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { MESSAGE_ENDPOINTS } from '@/lib/email-api-catalog';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';
import { EMAIL_API_PUBLIC_BASE } from '@/lib/email-api-catalog';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailRestCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiRestPage() {
  const c = docCopy(await getCurrentLocale(), emailRestCopy);
  const status = MESSAGE_ENDPOINTS[1];

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
        <DocCallout>
          {c.calloutBefore}{' '}
          <Link
            href="/documentation/email-api/sdk"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.calloutLink}
          </Link>{' '}
          {c.calloutAfter}
        </DocCallout>
      </DocSection>

      <DocSection id="send" title={c.toc[1]!.label}>
        <p>
          {c.sendIntro.split('@rukny/email')[0]}
          <DocInlineCode>@rukny/email</DocInlineCode>
          {c.sendIntro.split('@rukny/email')[1]}
        </p>
        <EmailApiCodePanel
          recipes={SEND_EMAIL_RECIPES}
          defaultLanguage="curl"
        />
      </DocSection>

      <DocSection id="status" title={c.toc[2]!.label}>
        <EmailApiCodePanel endpoint={status} defaultLanguage="curl" />
      </DocSection>

      <DocSection id="when" title={c.toc[3]!.label}>
        <DocH3>{c.goodFitTitle}</DocH3>
        <ul className="list-disc space-y-2 ps-5">
          {c.goodFit.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <DocH3>{c.preferSdkTitle}</DocH3>
        <ul className="list-disc space-y-2 ps-5">
          {c.preferSdk.map((item) => (
            <li key={item}>
              {item.includes('RuknyEmailError') ? (
                <>
                  {item.split('RuknyEmailError')[0]}
                  <DocInlineCode>RuknyEmailError</DocInlineCode>
                  {item.split('RuknyEmailError')[1]}
                </>
              ) : (
                item
              )}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api/sdk', label: c.prevLabel }}
        next={{
          href: '/documentation/email-api/reference',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
