'use client';

import { cn } from '@/lib/utils';
import {
  CollectionStripItem,
  CollectionStripItemSkeleton,
} from '@/components/products/collections/collection-strip-item';
import type { ProductCollection } from '@/lib/collections/types';

interface CollectionStripProps {
  collections: ProductCollection[];
  selectedCollectionId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onEdit: (collection: ProductCollection) => void;
  className?: string;
}

export function CollectionStrip({
  collections,
  selectedCollectionId,
  loading = false,
  onSelect,
  onEdit,
  className,
}: CollectionStripProps) {
  return (
    <div
      className={cn(
        '-mx-1 flex gap-3.5 overflow-x-auto overscroll-x-contain py-1.5 ps-3 pe-2 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:12px] sm:ps-4 sm:pe-3 [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {loading ? (
        Array.from({ length: 6 }).map((_, index) => <CollectionStripItemSkeleton key={index} />)
      ) : collections.length === 0 ? (
        <p className="py-2 text-sm text-[var(--muted-foreground)]">
          لا توجد مجموعات بعد. اضغط «إضافة مجموعة» للبدء.
        </p>
      ) : (
        collections.map((collection) => (
          <CollectionStripItem
            key={collection.id}
            collection={collection}
            selected={collection.id === selectedCollectionId}
            onSelect={() => onSelect(collection.id)}
            onEdit={() => onEdit(collection)}
          />
        ))
      )}
    </div>
  );
}
