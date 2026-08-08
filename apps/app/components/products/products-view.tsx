'use client';

import { ProductCatalogView } from '@/components/products/product-catalog-view';

export function ProductsView() {
  return (
    <ProductCatalogView
      kind="products"
      onAdd={() => {
        // TODO: open create product flow
      }}
    />
  );
}
