import type { UserRole } from '@/lib/types/users';
import { formatRelativeTime } from '@/lib/dashboard-format';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  PREMIUM: 'Premium',
  BASIC: 'Basic',
  GUEST: 'Guest',
};

export const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All roles' },
  { value: 'ADMIN', label: ROLE_LABELS.ADMIN },
  { value: 'PREMIUM', label: ROLE_LABELS.PREMIUM },
  { value: 'BASIC', label: ROLE_LABELS.BASIC },
  { value: 'GUEST', label: ROLE_LABELS.GUEST },
];

export const VERIFIED_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Verified email' },
  { value: 'false', label: 'Unverified' },
] as const;

export const VERIFICATION_LEVEL_OPTIONS = [
  { value: '', label: 'All levels' },
  { value: '0', label: 'Not verified' },
  { value: '1', label: 'Email verified' },
  { value: '2', label: 'Phone verified' },
  { value: '3', label: 'ID verified' },
] as const;

export const BOOL_FILTER_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

export const DEACTIVATED_FILTER_OPTIONS = [
  { value: '', label: 'All accounts' },
  { value: 'false', label: 'Active' },
  { value: 'true', label: 'Deactivated' },
] as const;

export function formatRole(role: UserRole | string): string {
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function roleBadgeClass(role: UserRole | string): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-[var(--danger)]/15 text-[var(--danger)]';
    case 'PREMIUM':
      return 'bg-[var(--primary)]/15 text-[var(--primary)]';
    case 'BASIC':
      return 'bg-[var(--success)]/15 text-[var(--success)]';
    default:
      return 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]';
  }
}

export function roleChipColor(
  role: UserRole | string,
): 'danger' | 'accent' | 'success' | 'default' {
  switch (role) {
    case 'ADMIN':
      return 'danger';
    case 'PREMIUM':
      return 'accent';
    case 'BASIC':
      return 'success';
    default:
      return 'default';
  }
}

export function accountStatusChipColor(
  isDeactivated: boolean,
): 'danger' | 'success' {
  return isDeactivated ? 'danger' : 'success';
}

export function formatUserDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatUserDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = formatUserDate(iso);
  const time = new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

export function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return 'Never signed in';
  return formatRelativeTime(iso);
}

export function displayUserName(
  name: string | null | undefined,
  email: string,
): string {
  return name?.trim() || email;
}

export function userInitials(
  name: string | null | undefined,
  email: string,
): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const VERIFICATION_LEVEL_LABELS: Record<number, string> = {
  0: 'Not verified',
  1: 'Email verified',
  2: 'Phone verified',
  3: 'ID verified',
};

export function formatVerificationLevel(level: number): string {
  return VERIFICATION_LEVEL_LABELS[level] ?? `Level ${level}`;
}

export function verificationLevelBadgeClass(level: number): string {
  if (level >= 3) return 'bg-[var(--success)]/15 text-[var(--success)]';
  if (level >= 1) return 'bg-[var(--primary)]/15 text-[var(--primary)]';
  return 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]';
}

export function verificationStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-[var(--warning)]/15 text-[var(--warning)]';
    case 'approved':
      return 'bg-[var(--success)]/15 text-[var(--success)]';
    case 'rejected':
      return 'bg-[var(--danger)]/15 text-[var(--danger)]';
    default:
      return 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]';
  }
}

export function formatDocumentType(type: string): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatSecurityAction(action: string): string {
  return action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
