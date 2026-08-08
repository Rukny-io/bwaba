'use client';

import { useMemo, useState } from 'react';
import { ProductsToolbar } from '@/components/products/products-toolbar';
import {
  PRODUCT_CATALOG_CONFIG,
  type ProductCatalogKind,
} from '@/components/products/product-catalog-config';
import type {
  ProductsSortOption,
  ProductsViewMode,
} from '@/components/products/products-view-mode';

interface ProductCatalogViewProps {
  kind: ProductCatalogKind;
  onAdd?: () => void;
}

export function ProductCatalogView({ kind, onAdd }: ProductCatalogViewProps) {
  const config = PRODUCT_CATALOG_CONFIG[kind];
  const [viewMode, setViewMode] = useState<ProductsViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductsSortOption>('newest');
  const [showHidden, setShowHidden] = useState(false);

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        title: config.searchEmptyTitle,
        description: `جرّب بحثاً مختلفاً عن «${searchQuery}».`,
      };
    }

    return {
      title: config.emptyTitle,
      description: config.emptyDescription,
    };
  }, [config, searchQuery]);

  const EmptyIcon = config.emptyIcon;

  return (
    <section className="dashboard-page flex flex-col gap-4 pt-5 sm:gap-5 sm:pt-10">
      <ProductsToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        searchPlaceholder={config.searchPlaceholder}
        addButtonLabel={config.addButtonLabel}
        showHiddenLabel={config.showHiddenLabel}
        hiddenSwitchAriaLabel={config.hiddenSwitchAriaLabel}
        onAdd={onAdd}
      />

      <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
        <EmptyIcon
          className="mb-3 size-8 text-[var(--muted-foreground)]/70"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-[14px] font-medium text-[var(--foreground)]">
          {emptyMessage.title}
        </p>
        <p className="mt-1 max-w-sm text-[13px] text-[var(--muted-foreground)]">
          {emptyMessage.description}
        </p>
      </div>
    </section>
  );
}
