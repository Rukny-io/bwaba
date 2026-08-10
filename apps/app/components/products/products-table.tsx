'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import type { Selection, SortDescriptor } from 'react-aria-components';
import { Avatar, Checkbox, Chip, Pagination, Table } from '@heroui/react';
import { ChevronUp } from 'lucide-react';
import type { StoreProduct } from '@/lib/products/types';
import { getProductDisplayName } from '@/lib/products/api';
import { formatProductPrice, getProductImage } from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import type { ProductKind } from '@/lib/products/types';
import {
  getProductCategoryLabel,
  getProductKindLabelFor,
  getProductStatusDisplay,
  getProductStockDisplay,
  getStockChipColor,
  resolveProductKind,
} from '@/lib/products/product-display';
import { cn } from '@/lib/utils';

const ROWS_PER_PAGE = 8;

const KIND_CHIP_COLOR: Record<ProductKind, 'success' | 'accent' | 'warning'> = {
  PHYSICAL: 'success',
  DIGITAL: 'accent',
  SERVICE: 'warning',
};

type SortColumn = 'product' | 'price' | 'stock' | 'category' | 'kind' | 'status';

function SortableColumnHeader({
  children,
  sortDirection,
  centered = false,
}: {
  children: React.ReactNode;
  sortDirection?: 'ascending' | 'descending';
  centered?: boolean;
}) {
  return (
    <span
      className={cn(
        'flex items-center gap-1.5',
        centered ? 'justify-center' : 'justify-between',
      )}
    >
      {children}
      {sortDirection ? (
        <ChevronUp
          className={cn(
            'size-3 shrink-0 text-muted transition-transform duration-100 ease-out',
            sortDirection === 'descending' && 'rotate-180',
          )}
          aria-hidden
        />
      ) : null}
    </span>
  );
}

function productSortValue(product: StoreProduct, column: SortColumn): string {
  switch (column) {
    case 'product':
      return getProductDisplayName(product);
    case 'price':
      return String(product.price ?? '');
    case 'stock':
      return getProductStockDisplay(product).label;
    case 'category':
      return getProductCategoryLabel(product) ?? '';
    case 'kind':
      return getProductKindLabelFor(product);
    case 'status':
      return getProductStatusDisplay(product).label;
    default:
      return '';
  }
}

function productInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

interface ProductsTableProps {
  products: StoreProduct[];
  className?: string;
}

function ProductsTableComponent({ products, className }: ProductsTableProps) {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'product',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);

  const sortedProducts = useMemo(() => {
    const column = sortDescriptor.column as SortColumn;
    return [...products].sort((a, b) => {
      const first = productSortValue(a, column);
      const second = productSortValue(b, column);
      let cmp = first.localeCompare(second, 'ar');

      if (sortDescriptor.direction === 'descending') {
        cmp *= -1;
      }

      return cmp;
    });
  }, [products, sortDescriptor]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [products, sortDescriptor]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageProducts = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedProducts.slice(start, start + ROWS_PER_PAGE);
  }, [page, sortedProducts]);

  const rangeStart =
    sortedProducts.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const rangeEnd = Math.min(page * ROWS_PER_PAGE, sortedProducts.length);
  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  return (
    <div
      className={cn(
        '[&_.table-root--primary]:bg-transparent [&_.table-root--primary]:p-0',
        '[&_.table__row:last-child_.table__cell]:border-b-0',
        className,
      )}
    >
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="جدول المنتجات"
            className="min-w-[800px]"
            dir="rtl"
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            sortDescriptor={sortDescriptor}
            onSelectionChange={setSelectedKeys}
            onSortChange={setSortDescriptor}
          >
            <Table.Header>
              <Table.Column className="pe-0">
                <Checkbox aria-label="تحديد الكل" slot="selection">
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </Table.Column>

              <Table.Column allowsSorting className="after:hidden" id="product" isRowHeader>
                {({ sortDirection }) => (
                  <SortableColumnHeader sortDirection={sortDirection}>
                    المنتج
                  </SortableColumnHeader>
                )}
              </Table.Column>

              <Table.Column allowsSorting className="text-center" id="price">
                {({ sortDirection }) => (
                  <SortableColumnHeader centered sortDirection={sortDirection}>
                    السعر
                  </SortableColumnHeader>
                )}
              </Table.Column>

              <Table.Column allowsSorting id="stock">
                {({ sortDirection }) => (
                  <SortableColumnHeader sortDirection={sortDirection}>
                    المخزون
                  </SortableColumnHeader>
                )}
              </Table.Column>

              <Table.Column allowsSorting className="text-center" id="category">
                {({ sortDirection }) => (
                  <SortableColumnHeader centered sortDirection={sortDirection}>
                    المجموعة
                  </SortableColumnHeader>
                )}
              </Table.Column>

              <Table.Column allowsSorting className="text-center" id="kind">
                {({ sortDirection }) => (
                  <SortableColumnHeader centered sortDirection={sortDirection}>
                    النوع
                  </SortableColumnHeader>
                )}
              </Table.Column>

              <Table.Column allowsSorting className="text-center" id="status">
                {({ sortDirection }) => (
                  <SortableColumnHeader centered sortDirection={sortDirection}>
                    الحالة
                  </SortableColumnHeader>
                )}
              </Table.Column>
            </Table.Header>

            <Table.Body>
              {pageProducts.map((product) => (
                <ProductTableRow key={product.id} product={product} />
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {totalPages > 1 ? (
          <Table.Footer>
            <Pagination size="sm">
              <Pagination.Summary>
                {`${rangeStart}–${rangeEnd} من ${sortedProducts.length}`}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page === 1}
                    onPress={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <Pagination.PreviousIcon />
                    السابق
                  </Pagination.Previous>
                </Pagination.Item>
                {pages.map((pageNumber) => (
                  <Pagination.Item key={pageNumber}>
                    <Pagination.Link
                      isActive={pageNumber === page}
                      onPress={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page === totalPages}
                    onPress={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    التالي
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        ) : null}
      </Table>
    </div>
  );
}

interface ProductTableRowProps {
  product: StoreProduct;
}

function ProductTableRowComponent({ product }: ProductTableRowProps) {
  const imageUrl = getProductImage(product as MyStoreProduct);
  const title = getProductDisplayName(product);
  const kind = resolveProductKind(product);
  const categoryLabel = getProductCategoryLabel(product);
  const stock = getProductStockDisplay(product);
  const status = getProductStatusDisplay(product);
  const basePrice = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== ''
      ? Number(product.salePrice)
      : null;
  const hasDiscount =
    salePrice != null && Number.isFinite(salePrice) && salePrice < basePrice;

  return (
    <Table.Row id={product.id}>
      <Table.Cell className="pe-0">
        <Checkbox
          aria-label={`تحديد ${title}`}
          slot="selection"
          variant="secondary"
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      </Table.Cell>

      <Table.Cell>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="sm">
            {imageUrl ? <Avatar.Image alt={title} src={imageUrl} /> : null}
            <Avatar.Fallback>{productInitials(title)}</Avatar.Fallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">{title}</span>
            <span className="truncate text-xs text-muted" dir="ltr">
              {product.sku ?? '—'}
            </span>
          </div>
        </div>
      </Table.Cell>

      <Table.Cell className="text-center">
        {hasDiscount ? (
          <span className="inline-flex flex-wrap items-center justify-center gap-1.5 whitespace-nowrap tabular-nums">
            <span className="text-xs text-muted line-through">
              {formatProductPrice(basePrice)}
            </span>
            <span className="text-xs font-semibold text-primary">
              {formatProductPrice(salePrice!)}
            </span>
          </span>
        ) : (
          <span className="inline-block whitespace-nowrap text-xs font-medium tabular-nums">
            {formatProductPrice(basePrice)}
          </span>
        )}
      </Table.Cell>

      <Table.Cell>
        {stock.variant === 'muted' ? (
          <span className="text-xs text-muted">—</span>
        ) : (
          <Chip color={getStockChipColor(stock.variant)} size="sm" variant="soft">
            {stock.label}
          </Chip>
        )}
      </Table.Cell>

      <Table.Cell className="text-center">
        {categoryLabel ? (
          <Chip size="sm" variant="soft">
            {categoryLabel}
          </Chip>
        ) : (
          <span className="text-xs text-muted">بدون مجموعة</span>
        )}
      </Table.Cell>

      <Table.Cell className="text-center">
        <Chip color={KIND_CHIP_COLOR[kind]} size="sm" variant="soft">
          {getProductKindLabelFor(product)}
        </Chip>
      </Table.Cell>

      <Table.Cell className="text-center">
        <Chip color={status.color} size="sm" variant="soft">
          {status.label}
        </Chip>
      </Table.Cell>
    </Table.Row>
  );
}

export function ProductsTableSkeleton() {
  return (
    <Table>
      <Table.ScrollContainer>
        <div className="min-w-[800px] animate-pulse">
          <div className="rounded-t-[min(32px,calc(var(--radius)*2.5))] bg-surface-secondary px-4 py-3">
            <div className="h-3 w-56 rounded-md bg-surface/60" />
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b border-separator/40 bg-surface px-4 py-3 last:border-b-0"
            >
              <div className="size-4 rounded bg-surface-secondary" />
              <div className="size-8 rounded-full bg-surface-secondary" />
              <div className="h-3.5 w-[24%] rounded-md bg-surface-secondary" />
              <div className="h-3 w-16 rounded-md bg-surface-secondary/80" />
              <div className="h-6 w-20 rounded-full bg-surface-secondary/80" />
              <div className="h-6 w-24 rounded-full bg-surface-secondary/80" />
              <div className="h-6 w-14 rounded-full bg-surface-secondary/80" />
              <div className="h-6 w-14 rounded-full bg-surface-secondary/80" />
            </div>
          ))}
        </div>
      </Table.ScrollContainer>
    </Table>
  );
}

const ProductTableRow = memo(ProductTableRowComponent);
export const ProductsTable = memo(ProductsTableComponent);
