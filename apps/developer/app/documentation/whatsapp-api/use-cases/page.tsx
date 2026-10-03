import type { Metadata } from 'next';
import Link from 'next/link';
import {
  DocumentationArticle,
  DocCallout,
  DocLinkCard,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappUseCasesCopy } from '@/lib/documentation-content/whatsapp-api/mid-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';

export async function generateMetadata(): Promise<Metadata> {
  const c = docCopy(await getCurrentLocale(), whatsappUseCasesCopy);
  return { title: c.metaTitle, description: c.metaDescription };
}

export default async function WhatsappApiUseCasesPage() {
  const c = docCopy(await getCurrentLocale(), whatsappUseCasesCopy);

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={c.title}
      description={c.description}
      toc={c.toc}
    >
      <DocSection id="otp" title={c.toc[0]!.label}>
        <p>{c.otp.body}</p>
        <DocLinkCard
          href="/documentation/whatsapp-api/send/otp"
          title={c.otp.cardTitle}
          description={c.otp.cardDesc}
        />
      </DocSection>

      <DocSection id="orders" title={c.toc[1]!.label}>
        <p>{c.orders.body}</p>
        <DocLinkCard
          href="/documentation/whatsapp-api/send/template"
          title={c.orders.cardTitle}
          description={c.orders.cardDesc}
        />
      </DocSection>

      <DocSection id="support" title={c.toc[2]!.label}>
        <p>{c.support.body}</p>
        <DocLinkCard
          href="/documentation/whatsapp-api/send/text"
          title={c.support.cardTitle}
          description={c.support.cardDesc}
        />
      </DocSection>

      <DocSection id="marketing" title={c.toc[3]!.label}>
        <p>{c.marketing.body}</p>
        <DocCallout>
          {c.marketing.calloutBefore}{' '}
          <Link
            href="/documentation/whatsapp-api/templates"
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {c.marketing.calloutLink}
          </Link>
          .
        </DocCallout>
      </DocSection>

      <DocPager
        prev={{
          href: '/documentation/whatsapp-api/get-started',
          label: c.prevLabel,
        }}
        next={{
          href: '/documentation/whatsapp-api/best-practices',
          label: c.nextLabel,
        }}
      />
    </DocumentationArticle>
  );
}
