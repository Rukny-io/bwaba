import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
  DocSteps,
} from '@/components/documentation/docs-article';
import { emailGetStartedCopy } from '@/lib/documentation-content/email-api/remaining';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import { SDK_INSTALL, SDK_QUICKSTART } from '@/lib/email-api-code-samples';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailGetStartedCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function EmailApiGetStartedPage() {
  const c = docCopy(await getCurrentLocale(), emailGetStartedCopy);

  return (
    <DocumentationArticle
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="before-you-begin" title={c.toc[0]!.label}>
        <ul className="list-disc space-y-2 ps-5">
          {c.beforeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="setup" title={c.setupTitle}>
        <DocSteps
          steps={c.steps.map((step) => ({
            title: step.title,
            body: <p>{step.body}</p>,
          }))}
        />
        <DocCallout title={c.tipTitle} tone="tip">
          {c.tipBody}
        </DocCallout>
      </DocSection>

      <DocSection id="send" title={c.sendTitle}>
        <p>{c.sendIntro}</p>
        <DocCode>{SDK_INSTALL}</DocCode>
        <DocCode>{SDK_QUICKSTART}</DocCode>
        <p>
          {c.sendOtherBefore}{' '}
          <Link
            href="/documentation/email-api/send"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.sendExamples}
          </Link>{' '}
          {c.sendOtherMid}{' '}
          <Link
            href="/documentation/email-api/rest"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.sendRest}
          </Link>
          .
        </p>
      </DocSection>

      <DocSection id="verify" title={c.verifyTitle}>
        <p>
          {c.verifyP1.includes('messages.getStatus(id)') ? (
            <>
              {c.verifyP1.split('messages.getStatus(id)')[0]}
              <DocInlineCode>messages.getStatus(id)</DocInlineCode>
              {c.verifyP1.split('messages.getStatus(id)')[1]}
            </>
          ) : (
            c.verifyP1
          )}
        </p>
        <p>{c.verifyP2}</p>
      </DocSection>

      <DocSection id="next" title={c.nextTitle}>
        <ul className="list-disc space-y-2 ps-5">
          {c.nextItems.map((item) => (
            <li key={item.href}>
              {item.before}{' '}
              <Link
                href={item.href}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {item.link}
              </Link>{' '}
              {item.after}
            </li>
          ))}
        </ul>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/email-api', label: c.prevLabel }}
        next={{
          href: '/documentation/email-api/use-cases',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
