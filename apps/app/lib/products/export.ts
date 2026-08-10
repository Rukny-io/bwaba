import { getProductDisplayName } from '@/lib/products/api';
import { getProductKindLabelFor, getProductStatusDisplay } from '@/lib/products/product-display';
import type { StoreProduct } from '@/lib/products/types';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportProductsToCsv(products: StoreProduct[]): void {
  const headers = [
    'معرّف المنتج',
    'الاسم',
    'SKU',
    'السعر',
    'سعر الخصم',
    'المخزون',
    'النوع',
    'الحالة',
    'المجموعة',
  ];

  const rows = products.map((product) => [
    product.id,
    getProductDisplayName(product),
    product.sku ?? '',
    String(product.price),
    product.salePrice != null && product.salePrice !== ''
      ? String(product.salePrice)
      : '',
    String(product.quantity),
    getProductKindLabelFor(product),
    getProductStatusDisplay(product).label,
    product.product_categories?.nameAr?.trim() ||
      product.product_categories?.name?.trim() ||
      '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  downloadCsv('products-export.csv', csv);
}
