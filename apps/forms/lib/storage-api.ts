import { api } from '@/lib/api-client';
import {
  buildStorageUsageSummary,
  type StorageUsageSummary,
} from '@/lib/storage-usage';

export type { StorageUsageSummary };

export interface StorageUsageResponse {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  files: number;
  trashUsed: number;
  categoryBreakdown: Record<string, number>;
  formsUsed?: number;
}

export async function getStorageUsage(): Promise<StorageUsageResponse> {
  const { data } = await api.get<StorageUsageResponse>('/storage/usage');
  return data;
}

/** Client-side: fetch usage and build display summary */
export async function loadStorageUsageSummary(): Promise<StorageUsageSummary> {
  const data = await getStorageUsage();
  return buildStorageUsageSummary(data);
}
