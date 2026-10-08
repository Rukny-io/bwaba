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
import { pickLocaleValue, useTranslations } from '@/lib/i18n';

const KIND_ICONS: Record<ProductKind, typeof Box> = {
  PHYSICAL: Box,
  DIGITAL: Download,
  SERVICE: Headphones,
};

export function ProductCreateKindView() {
  const router = useRouter();
  const { t, locale } = useTranslations();

  function handlePick(item: ProductKindCatalogItem) {
    router.push(getProductCreateKindPath(item.id));
  }

  return (
    <CreateProductChrome>
      <ProductCreateToolbar
        backHref={PRODUCTS_BASE_PATH}
        backLabel={t('products.create.backToProducts')}
      />

      <ProductCreateWorkspace>
        <header className="mb-6 sm:mb-8">
          <ProductCreatePill label={t('products.create.typePill')} />
          <h1 className="mt-4 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {t('products.create.typeTitle')}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t('products.create.typeDescription')}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {PRODUCT_KIND_CATALOG.map((item) => {
            const Icon = KIND_ICONS[item.id];
            return (
              <ProductCreateTypeTile
                key={item.id}
                label={pickLocaleValue(locale, { ar: item.label, en: item.labelEn })}
                hint={pickLocaleValue(locale, {
                  ar: item.description,
                  en: item.descriptionEn,
                })}
                examples={pickLocaleValue(locale, {
                  ar: item.examples,
                  en: item.examplesEn,
                })}
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
