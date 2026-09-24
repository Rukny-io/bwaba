import type { Metadata } from 'next';
import {
  DocumentationArticle,
  DocLinkCard,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { SEND_EXAMPLES } from '@/lib/email-api-send-catalog';

export const metadata: Metadata = {
  title: 'Sending examples — Email API | Rukny Documentation',
  description:
    'Send email with Node.js, Python, PHP, Go, Rust, SMTP, and more using the Rukny Email API.',
};

const TOC = [{ id: 'languages', label: 'Choose your stack' }];

export default function EmailApiSendIndexPage() {
  return (
    <DocumentationArticle
      title="Sending examples"
      description="Pick your language or integration method. Every example uses the same verified senders, quotas, and delivery pipeline — REST or SMTP."
      toc={TOC}
    >
      <DocSection id="languages" title="Choose your stack">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SEND_EXAMPLES.map((item) => (
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
        prev={{ href: '/documentation/email-api/messages', label: 'Messages' }}
        next={{
          href: '/documentation/email-api/send/node',
          label: 'Node.js',
        }}
      />
    </DocumentationArticle>
  );
}
