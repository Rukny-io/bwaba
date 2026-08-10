'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateProductForm } from '@/components/products/create/create-product-form';
import { CreateProductChrome } from '@/components/products/create/page/create-product-chrome';
import { ProductCreateToolbar } from '@/components/products/create/page/product-create-toolbar';
import { ProductCreateWorkspace } from '@/components/products/create/page/product-create-workspace';
import { getProductKindCatalogItem } from '@/lib/products/product-kind-catalog';
import {
  PRODUCTS_BASE_PATH,
  PRODUCTS_CREATE_PATH,
} from '@/lib/products/paths';
import type { ProductKind } from '@/lib/products/types';

const PRODUCT_CREATE_FORM_ID = 'product-create-form';

interface ProductCreateCanvasProps {
  kind: ProductKind;
}

export function ProductCreateCanvas({ kind }: ProductCreateCanvasProps) {
  const router = useRouter();
  const catalogItem = getProductKindCatalogItem(kind);
  const [submitting, setSubmitting] = useState(false);

  if (!catalogItem) {
    return null;
  }

  return (
    <CreateProductChrome>
      <ProductCreateToolbar
        backHref={PRODUCTS_CREATE_PATH}
        backLabel="نوع المنتج"
        submitLabel={submitting ? 'جاري الإنشاء…' : 'إنشاء المنتج'}
        submitFormId={PRODUCT_CREATE_FORM_ID}
        submitting={submitting}
        submitDisabled={submitting}
      />

      <ProductCreateWorkspace>
        <CreateProductForm
          kind={kind}
          catalogItem={catalogItem}
          layout="page"
          formId={PRODUCT_CREATE_FORM_ID}
          onBack={() => router.push(PRODUCTS_CREATE_PATH)}
          onSubmittingChange={setSubmitting}
          onCreated={() => router.push(PRODUCTS_BASE_PATH)}
        />
      </ProductCreateWorkspace>
    </CreateProductChrome>
  );
}
