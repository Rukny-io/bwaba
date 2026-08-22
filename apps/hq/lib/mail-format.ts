import type {
  MailAppStatus,
  MailDomainStatus,
  MailMailboxStatus,
  MailMessageStatus,
  MailPlanCode,
} from '@/lib/types/mail';
import { formatBytes } from '@/lib/dashboard-format';

export const MAIL_STATUS_OPTIONS: { value: MailAppStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const MAIL_PLAN_OPTIONS: { value: MailPlanCode | 'none' | ''; label: string }[] =
  [
    { value: '', label: 'All plans' },
    { value: 'STARTER', label: 'Starter' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'none', label: 'No subscription' },
  ];

export const MAIL_DOMAIN_STATUS_OPTIONS: {
  value: MailDomainStatus | '';
  label: string;
}[] = [
  { value: '', label: 'All domains' },
  { value: 'NONE', label: 'No domain' },
  { value: 'PENDING_DNS', label: 'Pending DNS' },
  { value: 'VERIFYING', label: 'Verifying' },
  { value: 'ACTIVE', label: 'Verified' },
  { value: 'FAILED', label: 'Failed' },
];

const DOMAIN_LABELS: Record<MailDomainStatus, string> = {
  NONE: 'No domain',
  PENDING_DNS: 'Pending DNS',
  VERIFYING: 'Verifying',
  ACTIVE: 'Verified',
  FAILED: 'Failed',
};

const APP_STATUS_LABELS: Record<MailAppStatus, string> = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

const PLAN_LABELS: Record<MailPlanCode, string> = {
  STARTER: 'Starter',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
};

export function formatMailDomainStatus(status: MailDomainStatus | string): string {
  return DOMAIN_LABELS[status as MailDomainStatus] ?? status;
}

export function formatMailAppStatus(status: MailAppStatus | string): string {
  return APP_STATUS_LABELS[status as MailAppStatus] ?? status;
}

export function formatMailPlan(plan: string | null | undefined): string {
  if (!plan) return 'No subscription';
  return PLAN_LABELS[plan as MailPlanCode] ?? plan;
}

export function formatMailAppType(type: string | null | undefined): string {
  if (type === 'BUSINESS') return 'Business';
  if (type === 'CONSUMER') return 'Consumer';
  return type || '—';
}

export function mailDomainStatusChipColor(
  status: MailDomainStatus | string,
): 'success' | 'default' | 'warning' | 'danger' | 'accent' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PENDING_DNS':
    case 'VERIFYING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'default';
  }
}

export function mailAppStatusChipColor(
  status: MailAppStatus | string,
): 'success' | 'default' | 'warning' | 'danger' {
  return status === 'ACTIVE' ? 'success' : 'default';
}

export function mailMailboxStatusChipColor(
  status: MailMailboxStatus | string,
): 'success' | 'default' | 'warning' | 'danger' {
  if (status === 'ACTIVE') return 'success';
  if (status === 'DISABLED') return 'warning';
  return 'danger';
}

export function mailDeliveryStatusChipColor(
  status: MailMessageStatus | string,
): 'success' | 'default' | 'warning' | 'danger' {
  if (status === 'FAILED') return 'danger';
  if (status === 'QUEUED') return 'warning';
  if (status === 'SENT' || status === 'RECEIVED') return 'success';
  return 'default';
}

export function formatMailMailboxStatus(status: string): string {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'DISABLED') return 'Disabled';
  return status;
}

export function formatMailStorage(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes >= 1024 ** 3) {
    const gb = bytes / 1024 ** 3;
    return `${gb >= 10 ? gb.toFixed(1) : gb.toFixed(2)} GB`;
  }
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return formatBytes(bytes);
}

export function formatMailStorageRatio(used: number, quota: number): string {
  if (quota <= 0) return formatMailStorage(used);
  const percent = Math.round((used / quota) * 1000) / 10;
  return `${formatMailStorage(used)} / ${formatMailStorage(quota)} · ${percent}%`;
}

export function formatMailDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatMailDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
