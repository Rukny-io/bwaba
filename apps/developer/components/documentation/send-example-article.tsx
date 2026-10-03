import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocCode,
  DocInlineCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import {
  emailSendChromeCopy,
  getLocalizedSendExample,
  getLocalizedSendExamplePager,
} from '@/lib/documentation-content/email-api/send-examples';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import type { SendExampleId } from '@/lib/email-api-send-catalog';

export async function SendExampleArticle({ id }: { id: SendExampleId }) {
  const locale = await getCurrentLocale();
  const example = getLocalizedSendExample(id, locale);
  if (!example) return null;

  const chrome = docCopy(locale, emailSendChromeCopy);
  const pager = getLocalizedSendExamplePager(id, locale);
  const toc = [
    { id: 'prerequisites', label: chrome.prerequisites },
    ...example.sections.map((section) => ({
      id: section.id,
      label: section.title,
    })),
  ];

  return (
    <DocumentationArticle
      title={example.label}
      description={example.description}
      toc={toc}
    >
      <DocSection id="prerequisites" title={chrome.prerequisites}>
        <ul className="list-disc space-y-2 ps-5">
          {example.prerequisites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <DocCallout title={chrome.beforeSendTitle}>
          {chrome.beforeSendBefore}{' '}
          <Link
            href="/login?next=/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {chrome.beforeSendLink}
          </Link>
          {chrome.beforeSendAfter.split('Idempotency-Key')[0]}
          <DocInlineCode>Idempotency-Key</DocInlineCode>
          {chrome.beforeSendAfter.split('Idempotency-Key')[1]}
        </DocCallout>
      </DocSection>

      {example.sections.map((section) => (
        <DocSection key={section.id} id={section.id} title={section.title}>
          {section.description ? <p>{section.description}</p> : null}
          <DocCode language={section.language} title={section.title}>
            {section.code}
          </DocCode>
        </DocSection>
      ))}

      <DocPager prev={pager.prev} next={pager.next} />
    </DocumentationArticle>
  );
}
