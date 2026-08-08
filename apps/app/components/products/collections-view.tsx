'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import {
  CollectionCard,
  CollectionCardSkeleton,
} from '@/components/products/collections/collection-card';
import { CreateCollectionDialog } from '@/components/products/collections/create-collection-dialog';
import { ProductsToolbar } from '@/components/products/products-toolbar';
import { fetchCollections } from '@/lib/collections/api';
import type { ProductCollection } from '@/lib/collections/types';
import { ApiException } from '@/lib/api-client';
import type {
  ProductsSortOption,
  ProductsViewMode,
} from '@/components/products/products-view-mode';
import { PRODUCT_CATALOG_CONFIG } from '@/components/products/product-catalog-config';
import { cn } from '@/lib/utils';

const config = PRODUCT_CATALOG_CONFIG.collections;

export function CollectionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ProductsViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<ProductsSortOption>('newest');
  const [showHidden, setShowHidden] = useState(false);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadCollections = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchCollections(showHidden);
      setCollections(rows);
    } catch (err) {
      setError(
        err instanceof ApiException
          ? err.message
          : 'تعذّر تحميل المجموعات',
      );
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [showHidden]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setCreateOpen(true);
      router.replace('/app/products/collections', { scroll: false });
    }
  }, [searchParams, router]);

  function handleCreateClose() {
    setCreateOpen(false);
  }

  function handleCreated() {
    setCreateOpen(false);
    setLoading(true);
    void loadCollections();
  }

  const filteredCollections = useMemo(() => {
    let rows = [...collections];
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      rows = rows.filter((collection) => {
        const haystack = [
          collection.name,
          collection.nameAr,
          collection.description,
          collection.slug,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    rows.sort((a, b) => {
      if (sortBy === 'name_asc') {
        const aName = (a.nameAr || a.name).toLowerCase();
        const bName = (b.nameAr || b.name).toLowerCase();
        return aName.localeCompare(bName, 'ar');
      }

      if (sortBy === 'price_asc') {
        return a.productsCount - b.productsCount;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return rows;
  }, [collections, searchQuery, sortBy]);

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
  }, [searchQuery]);

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
        onAdd={() => setCreateOpen(true)}
      />

      <CreateCollectionDialog
        open={createOpen}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />

      {loading ? (
        <div
          className={cn(
            viewMode === 'inline'
              ? 'flex flex-col gap-2.5 sm:gap-3'
              : 'grid auto-rows-fr grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4',
            viewMode === 'full' && 'grid-cols-1',
          )}
        >
          {Array.from({ length: viewMode === 'inline' ? 4 : 8 }).map((_, index) => (
            <CollectionCardSkeleton key={index} inline={viewMode === 'inline'} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-8 text-center">
          <p className="text-[14px] font-medium text-[var(--foreground)]">{error}</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
          <Layers
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
      ) : viewMode === 'inline' ? (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <AnimatePresence initial={false}>
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                viewMode="inline"
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div
          className={cn(
            'grid auto-rows-fr gap-3 sm:gap-4',
            viewMode === 'full'
              ? 'grid-cols-1'
              : 'grid-cols-2 lg:grid-cols-4',
          )}
        >
          <AnimatePresence initial={false}>
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                viewMode={viewMode}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
