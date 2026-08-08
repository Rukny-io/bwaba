import { api } from '@/lib/api-client';
import type {
  CreateProductCollectionInput,
  MyStoreProduct,
  ProductCollection,
  UpdateProductCollectionInput,
} from '@/lib/collections/types';

const BASE = '/stores/my-store/collections';

export async function fetchCollections(
  includeInactive = false,
): Promise<ProductCollection[]> {
  const { data } = await api.get<ProductCollection[]>(BASE, {
    includeInactive: includeInactive ? 'true' : undefined,
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchCollection(id: string): Promise<ProductCollection> {
  const { data } = await api.get<ProductCollection>(`${BASE}/${id}`);
  return data;
}

export async function createCollection(
  input: CreateProductCollectionInput,
): Promise<ProductCollection> {
  const { data } = await api.post<ProductCollection>(BASE, input);
  return data;
}

export async function updateCollection(
  id: string,
  input: UpdateProductCollectionInput,
): Promise<ProductCollection> {
  const { data } = await api.put<ProductCollection>(`${BASE}/${id}`, input);
  return data;
}

export async function deleteCollection(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

export async function fetchMyStoreProducts(search?: string): Promise<MyStoreProduct[]> {
  const { data } = await api.get<MyStoreProduct[]>('/products/my-products', {
    ...(search?.trim() ? { search: search.trim() } : {}),
  });
  return Array.isArray(data) ? data : [];
}

export function getCollectionDisplayName(collection: ProductCollection): string {
  return collection.nameAr?.trim() || collection.name;
}

export function getProductDisplayName(product: MyStoreProduct): string {
  return product.nameAr?.trim() || product.name;
}
