import { api } from '@/lib/api-client';
import type { DeveloperProductId } from '@/lib/developer-products';

export interface InstalledProduct {
  productId: DeveloperProductId;
  installedAt: string;
}

export async function listInstalledProducts(
  publicAppId: string,
): Promise<InstalledProduct[]> {
  const { data } = await api.get<InstalledProduct[]>(
    `/developer/apps/${encodeURIComponent(publicAppId)}/products`,
  );
  return Array.isArray(data) ? data : [];
}

export async function installProduct(
  publicAppId: string,
  productId: DeveloperProductId,
): Promise<InstalledProduct> {
  const { data } = await api.post<InstalledProduct>(
    `/developer/apps/${encodeURIComponent(publicAppId)}/products/${encodeURIComponent(productId)}/install`,
  );
  return data;
}

export async function getProductInstallStatus(
  publicAppId: string,
  productId: DeveloperProductId,
): Promise<{ installed: boolean }> {
  const { data } = await api.get<{ installed: boolean }>(
    `/developer/apps/${encodeURIComponent(publicAppId)}/products/${encodeURIComponent(productId)}/status`,
  );
  return data;
}
