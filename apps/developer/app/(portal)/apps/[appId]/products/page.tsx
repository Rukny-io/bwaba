import { Suspense } from 'react';
import { ProductsGrid } from '@/components/products/products-grid';
import { ProductRequiredBanner } from '@/components/products/product-required-banner';
import { requireAppForUser } from '@/lib/dal';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return (
    <>
      <Suspense fallback={null}>
        <ProductRequiredBanner />
      </Suspense>
      <ProductsGrid appId={app.appId} />
    </>
  );
}
