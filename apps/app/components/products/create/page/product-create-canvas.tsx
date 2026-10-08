'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import { useTranslations } from '@/lib/i18n';

const PRODUCT_CREATE_FORM_ID = 'product-create-form';

interface ProductCreateCanvasProps {
  kind: ProductKind;
}

export function ProductCreateCanvas({ kind }: ProductCreateCanvasProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProductId = searchParams.get('edit');
  const isEditing = Boolean(editProductId);
  const catalogItem = getProductKindCatalogItem(kind);
  const [submitting, setSubmitting] = useState(false);

  if (!catalogItem) {
    return null;
  }

  return (
    <CreateProductChrome>
      <ProductCreateToolbar
        backHref={PRODUCTS_CREATE_PATH}
        backLabel={t('products.create.backToKind')}
        submitLabel={
          submitting
            ? isEditing
              ? t('products.create.saving')
              : t('products.create.creating')
            : isEditing
              ? t('products.create.saveEdits')
              : t('products.create.createProduct')
        }
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
          productId={editProductId}
          onBack={() => router.push(PRODUCTS_BASE_PATH)}
          onSubmittingChange={setSubmitting}
          onCreated={() => router.push(PRODUCTS_BASE_PATH)}
        />
      </ProductCreateWorkspace>
    </CreateProductChrome>
  );
}
