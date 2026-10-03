import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocLinkCard,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import {
  emailSendChromeCopy,
  getLocalizedSendExamples,
} from '@/lib/documentation-content/email-api/send-examples';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), emailSendChromeCopy);
  return { title: c.indexMetaTitle, description: c.indexMetaDescription };
}

export default async function EmailApiSendIndexPage() {
  const locale = await getCurrentLocale();
  const c = docCopy(locale, emailSendChromeCopy);
  const examples = getLocalizedSendExamples(locale);

  return (
    <DocumentationArticle
      title={c.indexTitle}
      description={c.indexDescription}
      toc={[{ id: 'languages', label: c.indexToc }]}
    >
      <DocSection id="languages" title={c.indexToc}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {examples.map((item) => (
            <DocLinkCard
              key={item.id}
              href={`/documentation/email-api/send/${item.id}`}
              title={item.label}
              description={item.description}
            />
          ))}
        </div>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/email-api/messages',
          label: c.prevMessages,
        }}
        next={{
          href: '/documentation/email-api/send/node',
          label: examples[0]?.label ?? 'Node.js',
        }}
      />
    </DocumentationArticle>
  );
}
