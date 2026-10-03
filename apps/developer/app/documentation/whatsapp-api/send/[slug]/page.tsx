import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DocumentationArticle,
  DocCode,
  DocPager,
  DocSection,
} from '@/components/documentation/docs-article';
import { whatsappRecipeMeta } from '@/lib/documentation-content/whatsapp-api/short-pages';
import { docCopy } from '@/lib/documentation-content/types';
import { getCurrentLocale } from '@/lib/dictionary';
import {
  buildRecipeCodeSample,
  SEND_MESSAGE_RECIPES,
  type CodeSampleLanguage,
} from '@/lib/whatsapp-api-code-samples';

const LINKS = {
  text: {
    prev: '/documentation/whatsapp-api/send',
    next: '/documentation/whatsapp-api/send/template',
  },
  template: {
    prev: '/documentation/whatsapp-api/send/text',
    next: '/documentation/whatsapp-api/send/otp',
  },
  otp: {
    prev: '/documentation/whatsapp-api/send/template',
    next: '/documentation/whatsapp-api/sdk',
  },
} as const;

const LANGS: { id: CodeSampleLanguage; label: string }[] = [
  { id: 'curl', label: 'curl' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'php', label: 'PHP' },
];

export function generateStaticParams() {
  return SEND_MESSAGE_RECIPES.map((recipe) => ({ slug: recipe.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = docCopy(await getCurrentLocale(), whatsappRecipeMeta)[slug];
  if (!meta) return { title: 'Sending example | Rukny Documentation' };
  return {
    title: meta.metaTitle,
    description: meta.description,
  };
}

export default async function WhatsappApiSendRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = SEND_MESSAGE_RECIPES.find((item) => item.id === slug);
  const meta = docCopy(await getCurrentLocale(), whatsappRecipeMeta)[slug];
  const links = LINKS[slug as keyof typeof LINKS];
  if (!recipe || !meta || !links) notFound();

  return (
    <DocumentationArticle
      productId="whatsapp-api"
      title={meta.title}
      description={meta.description}
      toc={LANGS.map((lang) => ({ id: lang.id, label: lang.label }))}
    >
      {LANGS.map((lang) => (
        <DocSection key={lang.id} id={lang.id} title={lang.label}>
          <DocCode language={lang.id}>
            {buildRecipeCodeSample(lang.id, recipe)}
          </DocCode>
        </DocSection>
      ))}

      <DocPager
        prev={{ href: links.prev, label: meta.prevLabel }}
        next={{ href: links.next, label: meta.nextLabel }}
      />
    </DocumentationArticle>
  );
}
