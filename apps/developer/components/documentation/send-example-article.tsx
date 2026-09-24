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
  getSendExample,
  getSendExamplePager,
  type SendExampleId,
} from '@/lib/email-api-send-catalog';

export function SendExampleArticle({ id }: { id: SendExampleId }) {
  const example = getSendExample(id);
  if (!example) return null;

  const pager = getSendExamplePager(id);
  const toc = [
    { id: 'prerequisites', label: 'Prerequisites' },
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
      <DocSection id="prerequisites" title="Prerequisites">
        <ul className="list-disc space-y-2 ps-5">
          {example.prerequisites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <DocCallout title="Before you send">
          Verify your domain and authorize a sender in the{' '}
          <Link
            href="/login?next=/apps"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            developer portal
          </Link>
          . Live sends require an <DocInlineCode>Idempotency-Key</DocInlineCode>{' '}
          on REST requests (SMTP uses Message-ID).
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
