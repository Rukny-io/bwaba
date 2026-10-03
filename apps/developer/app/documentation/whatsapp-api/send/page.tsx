import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocLinkCard,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappSendIndexCopy } from '@/lib/documentation-content/whatsapp-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappSendIndexCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiSendPage() {
  const c = docCopy(await getCurrentLocale(), whatsappSendIndexCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="recipes" title={c.toc[0]!.label}>
        <div className="space-y-2.5">
          {c.recipes.map((card) => (
            <DocLinkCard
              key={card.href}
              href={card.href}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
      </DocSection>

      <DocSection id="languages" title={c.toc[1]!.label}>
        <p>
          {c.languagesBefore}{' '}
          <Link
            href="/documentation/whatsapp-api/rest"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.languagesLink}
          </Link>{' '}
          {c.languagesAfter}
        </p>
      </DocSection>

      <DocPager
        prev={{ href: '/documentation/whatsapp-api/errors', label: c.prevLabel }}
        next={{
          href: '/documentation/whatsapp-api/send/text',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
