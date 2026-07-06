import 'server-only';

import { serverApiFetch } from '@/lib/server-api';
import {
  buildStorageUsageSummary,
  type StorageUsageSummary,
} from '@/lib/storage-usage';
import type { StorageUsageResponse } from '@/lib/storage-api';

export type { StorageUsageSummary };

export async function fetchStorageUsageServer(): Promise<StorageUsageResponse | null> {
  return serverApiFetch<StorageUsageResponse>('/storage/usage');
}

export async function getStorageUsageSummary(): Promise<StorageUsageSummary> {
  const data = await fetchStorageUsageServer();
  return buildStorageUsageSummary(data);
}
