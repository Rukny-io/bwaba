import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicAgProductPage } from '@/components/marketing/public-ag-product-page';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import {
  getLocalizedProductPage,
  getProductNotFoundTitle,
} from '@/lib/get-localized-product-page';
import { getMessages } from '@/lib/i18n';
import { getLocale } from '@/lib/i18n-server';
import { PRODUCT_SLUGS } from '@/lib/public-marketing-pages';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const messages = getMessages(locale);
  const product = getLocalizedProductPage(slug, locale);

  if (!product) {
    return { title: getProductNotFoundTitle(locale) };
  }

  return {
    title: `${product.title} ${messages.meta.productTitleSuffix}`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const product = getLocalizedProductPage(slug, locale);

  if (!product) notFound();

  return (
    <PublicMarketingShell smoothScroll={false}>
      <main className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgProductPage slug={product.slug} />
      </main>
    </PublicMarketingShell>
  );
}
