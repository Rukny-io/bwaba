import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicAgProductPage } from '@/components/marketing/public-ag-product-page';
import { PublicMarketingShell } from '@/components/marketing/public-marketing-shell';
import {
  PRODUCT_SLUGS,
  getProductPage,
} from '@/lib/public-marketing-pages';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductPage(slug);

  if (!product) {
    return { title: 'المنتج غير موجود — ركني' };
  }

  return {
    title: `${product.title} — ركني`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductPage(slug);

  if (!product) notFound();

  return (
    <PublicMarketingShell smoothScroll={false}>
      <main dir="rtl" lang="ar" className="overflow-x-clip bg-white pt-14 text-[#1D1D1D]">
        <PublicAgProductPage slug={product.slug} />
      </main>
    </PublicMarketingShell>
  );
}
