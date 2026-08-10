'use client';

import { useRouter } from 'next/navigation';
import { Box, Download, Headphones } from 'lucide-react';
import { CreateProductChrome } from '@/components/products/create/page/create-product-chrome';
import { ProductCreatePill, ProductCreateTypeTile } from '@/components/products/create/page/product-create-primitives';
import { ProductCreateToolbar } from '@/components/products/create/page/product-create-toolbar';
import { ProductCreateWorkspace } from '@/components/products/create/page/product-create-workspace';
import {
  PRODUCT_KIND_CATALOG,
  type ProductKindCatalogItem,
} from '@/lib/products/product-kind-catalog';
import {
  getProductCreateKindPath,
  PRODUCTS_BASE_PATH,
} from '@/lib/products/paths';
import type { ProductKind } from '@/lib/products/types';

const KIND_ICONS: Record<ProductKind, typeof Box> = {
  PHYSICAL: Box,
  DIGITAL: Download,
  SERVICE: Headphones,
};

export function ProductCreateKindView() {
  const router = useRouter();

  function handlePick(item: ProductKindCatalogItem) {
    router.push(getProductCreateKindPath(item.id));
  }

  return (
    <CreateProductChrome>
      <ProductCreateToolbar
        backHref={PRODUCTS_BASE_PATH}
        backLabel="المنتجات"
      />

      <ProductCreateWorkspace>
        <header className="mb-6 sm:mb-8">
          <ProductCreatePill label="نوع المنتج" />
          <h1 className="mt-4 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            ماذا تريد أن تبيع؟
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
            اختر النوع الأقرب لما تقدّمه — يمكنك لاحقاً إضافة التفاصيل والصور والأسعار.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {PRODUCT_KIND_CATALOG.map((item) => {
            const Icon = KIND_ICONS[item.id];
            return (
              <ProductCreateTypeTile
                key={item.id}
                label={item.label}
                hint={item.description}
                icon={Icon}
                onClick={() => handlePick(item)}
              />
            );
          })}
        </div>
      </ProductCreateWorkspace>
    </CreateProductChrome>
  );
}
