import { ApiException, getCsrfToken } from '@/lib/api-client';
import { ACTIVE_WORKSPACE_HEADER, readActiveWorkspaceIdFromBrowser } from '@/lib/workspace';
import type {
  CreateProductInput,
  ProductKind,
  ProductStatus,
  StoreProduct,
} from '@/lib/products/types';
import {
  buildProductAttributesPayload,
  buildVariantsPayload,
} from '@/lib/products/template-utils';
import type {
  CategoryTemplateFields,
  StoreProductTemplateResponse,
} from '@/lib/products/template-types';

function buildAuthHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';

  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const workspaceId = readActiveWorkspaceIdFromBrowser();
  if (workspaceId) headers[ACTIVE_WORKSPACE_HEADER] = workspaceId;

  return headers;
}

function buildProductAttributes(
  input: CreateProductInput,
  template: CategoryTemplateFields | null,
) {
  if (input.templateValues && template) {
    return buildProductAttributesPayload(template, input.templateValues);
  }

  if (input.kind !== 'SERVICE') return undefined;

  const attrs = [];
  if (input.serviceType) {
    attrs.push({ key: 'serviceType', value: input.serviceType });
  }
  if (input.serviceDuration?.trim()) {
    attrs.push({
      key: 'duration',
      value: input.serviceDuration.trim(),
      valueAr: input.serviceDuration.trim(),
    });
  }
  if (input.deliveryMethod) {
    attrs.push({ key: 'deliveryMethod', value: input.deliveryMethod });
  }

  return attrs.length ? attrs : undefined;
}

export async function fetchStoreProductTemplate(): Promise<StoreProductTemplateResponse> {
  const { api } = await import('@/lib/api-client');
  const { data } = await api.get<StoreProductTemplateResponse>('/stores/my-store/template');
  return (
    data ?? {
      storeId: null,
      categoryId: null,
      categorySlug: null,
      categoryName: null,
      categoryNameAr: null,
      template: null,
    }
  );
}

export async function fetchStoreProducts(search?: string): Promise<StoreProduct[]> {
  const { api } = await import('@/lib/api-client');
  const { data } = await api.get<StoreProduct[]>('/products/my-products', {
    ...(search?.trim() ? { search: search.trim() } : {}),
  });
  return Array.isArray(data) ? data : [];
}

export async function fetchStoreProduct(id: string): Promise<StoreProduct> {
  const { api } = await import('@/lib/api-client');
  const { data } = await api.get<StoreProduct>(
    `/products/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus,
): Promise<StoreProduct> {
  const { api } = await import('@/lib/api-client');
  const { data } = await api.patch<StoreProduct>(
    `/products/${encodeURIComponent(id)}`,
    { status },
  );
  return data;
}

export async function createProduct(
  input: CreateProductInput,
  template: CategoryTemplateFields | null = null,
): Promise<StoreProduct> {
  const { api } = await import('@/lib/api-client');

  const useVariants = Boolean(
    input.hasVariants && input.variants && input.variants.length > 0,
  );

  const payload = {
    kind: input.kind,
    name: input.name,
    nameAr: input.nameAr,
    description: input.description,
    descriptionAr: input.descriptionAr,
    price: input.price,
    salePrice: input.salePrice,
    quantity:
      input.kind === 'PHYSICAL' && !useVariants ? (input.quantity ?? 0) : 0,
    sku: input.sku,
    status: input.status ?? 'ACTIVE',
    currency: input.currency ?? 'IQD',
    hasVariants: useVariants,
    productAttributes: buildProductAttributes(input, template),
    variants: useVariants
      ? buildVariantsPayload(
          input.variants!.map((variant, index) => ({
            id: `draft_${index}`,
            attributes: variant.attributes,
            stock: variant.stock,
          })),
          input.price,
        )
      : undefined,
  };

  const { data } = await api.post<StoreProduct>('/products', payload);
  return data;
}

export async function uploadProductImages(
  productId: string,
  files: File[],
): Promise<void> {
  if (!files.length) return;

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`/api/v1/products/${productId}/images`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: buildAuthHeaders(false),
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] };

  if (!response.ok) {
    const raw = payload.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : 'تعذّر رفع صور المنتج';
    throw new ApiException(response.status, message);
  }
}

export async function uploadDigitalProductFile(
  productId: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/v1/stores/products/${productId}/digital-file`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: buildAuthHeaders(false),
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] };

  if (!response.ok) {
    const raw = payload.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : 'تعذّر رفع الملف الرقمي';
    throw new ApiException(response.status, message);
  }
}

export function getProductDisplayName(product: Pick<StoreProduct, 'name' | 'nameAr'>): string {
  return product.nameAr?.trim() || product.name;
}

export function getProductKindLabel(kind: ProductKind): string {
  const labels: Record<ProductKind, string> = {
    PHYSICAL: 'مادي',
    DIGITAL: 'رقمي',
    SERVICE: 'خدمة',
  };
  return labels[kind];
}
