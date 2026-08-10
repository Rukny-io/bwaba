import type { StoreStatus } from '@/lib/types/stores';
import { formatOwnerPrimary, formatOwnerSecondary } from '@/lib/forms-format';

export const STORE_STATUS_OPTIONS: { value: StoreStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const STORE_STATUS_HINTS: Record<StoreStatus, string> = {
  ACTIVE: 'Store is live and visible to customers',
  INACTIVE: 'Store is hidden or suspended',
};

export function formatStoreStatus(status: StoreStatus | string): string {
  return STORE_STATUS_LABELS[status as StoreStatus] ?? status;
}

export function storeStatusHint(status: StoreStatus | string): string {
  return STORE_STATUS_HINTS[status as StoreStatus] ?? formatStoreStatus(status);
}

export function storeStatusChipColor(
  status: StoreStatus | string,
): 'success' | 'default' | 'warning' | 'danger' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'INACTIVE':
      return 'warning';
    default:
      return 'default';
  }
}

export function formatStoreDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatStoreDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStoreMetric(value: number): string {
  if (value === 0) return '—';
  return value.toLocaleString('en-US');
}

export function formatStorePrice(
  value: string | number | null | undefined,
  currency = 'IQD',
): string {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString('en-US')} ${currency}`;
}

export function formatStoreOwnerPrimary(owner: {
  profile: { name: string | null; username: string | null } | null;
  email: string;
}): string {
  return formatOwnerPrimary({
    name: owner.profile?.name ?? null,
    username: owner.profile?.username ?? null,
    email: owner.email,
  });
}

export function formatStoreOwnerSecondary(owner: {
  profile: { name: string | null; username: string | null } | null;
  email: string;
}): string | null {
  return formatOwnerSecondary({
    name: owner.profile?.name ?? null,
    username: owner.profile?.username ?? null,
    email: owner.email,
  });
}

export function formatCategoryLabel(category: {
  name: string;
  nameAr: string;
}): string {
  return `${category.name} · ${category.nameAr}`;
}
