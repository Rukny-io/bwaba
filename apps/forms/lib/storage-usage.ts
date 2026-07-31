import {
  DEFAULT_STORAGE_LIMIT_BYTES,
  FORMS_STORAGE_CATEGORIES,
  FORMS_STORAGE_CATEGORY_LABELS,
  formatStorageBytes,
  sumFormsStorageBytes,
} from '@/lib/storage-format';
import type { StorageUsageResponse } from '@/lib/storage-api';

export interface StorageCategoryItem {
  category: string;
  label: string;
  bytes: number;
}

export interface StorageUsageSummary {
  used: number;
  limit: number;
  available: number;
  percentage: number;
  files: number;
  trashUsed: number;
  formsUsed: number;
  otherUsed: number;
  categoryBreakdown: Record<string, number>;
  formsCategories: StorageCategoryItem[];
  usedLabel: string;
  limitLabel: string;
  availableLabel: string;
  formsUsedLabel: string;
}

export function buildStorageUsageSummary(
  data: StorageUsageResponse | null,
): StorageUsageSummary {
  const limit = data?.limit ?? DEFAULT_STORAGE_LIMIT_BYTES;
  const used = data?.used ?? 0;
  const available = data?.available ?? Math.max(0, limit - used);
  const percentage =
    data?.percentage ??
    (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0);

  const categoryBreakdown = data?.categoryBreakdown ?? {};
  const formsUsed =
    data?.formsUsed ?? sumFormsStorageBytes(categoryBreakdown);
  const otherUsed = Math.max(0, used - formsUsed);

  const formsCategories: StorageCategoryItem[] = FORMS_STORAGE_CATEGORIES.map(
    (category) => ({
      category,
      label: FORMS_STORAGE_CATEGORY_LABELS[category],
      bytes: categoryBreakdown[category] ?? 0,
    }),
  );

  return {
    used,
    limit,
    available,
    percentage,
    files: data?.files ?? 0,
    trashUsed: data?.trashUsed ?? 0,
    formsUsed,
    otherUsed,
    categoryBreakdown,
    formsCategories,
    usedLabel: formatStorageBytes(used),
    limitLabel: formatStorageBytes(limit),
    availableLabel: formatStorageBytes(available),
    formsUsedLabel: formatStorageBytes(formsUsed),
  };
}
