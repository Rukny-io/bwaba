'use client';

import { ProductCatalogView } from '@/components/products/product-catalog-view';

export function DiscountsView() {
  return (
    <ProductCatalogView
      kind="discounts"
      onAdd={() => {
        // TODO: open create discount flow
      }}
    />
  );
}
