import {
  getCollectionDisplayName,
  getProductDisplayName,
} from '@/lib/collections/api';
import type { MyStoreProduct, ProductCollection } from '@/lib/collections/types';

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

export function exportCollectionProductsToCsv(
  collection: ProductCollection,
  products: MyStoreProduct[],
): void {
  const headers = ['معرّف المنتج', 'الاسم', 'السعر', 'الحالة'];
  const rows = products.map((product) => [
    product.id,
    getProductDisplayName(product),
    String(product.price),
    product.status,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  const slug = collection.slug?.trim() || collection.id;
  downloadCsv(`${slug}-products.csv`, csv);
}

export function exportAllCollectionsToCsv(
  collections: ProductCollection[],
  products: MyStoreProduct[],
): void {
  const productById = new Map(products.map((product) => [product.id, product]));
  const headers = [
    'معرّف المجموعة',
    'اسم المجموعة',
    'معرّف المنتج',
    'اسم المنتج',
    'السعر',
    'حالة المنتج',
  ];

  const rows: string[][] = [];

  for (const collection of collections) {
    const collectionName = getCollectionDisplayName(collection);

    if (collection.productIds.length === 0) {
      rows.push([collection.id, collectionName, '', '', '', '']);
      continue;
    }

    for (const productId of collection.productIds) {
      const product = productById.get(productId);
      rows.push([
        collection.id,
        collectionName,
        productId,
        product ? getProductDisplayName(product) : '',
        product ? String(product.price) : '',
        product?.status ?? 'غير موجود',
      ]);
    }
  }

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n');

  downloadCsv('collections-export.csv', csv);
}
