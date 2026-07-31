import type { FormStatus, FormType, FormVisibility } from '@/lib/types/forms';

export const FORM_VISIBILITY_OPTIONS: {
  value: FormVisibility | '';
  label: string;
}[] = [
  { value: '', label: 'Active forms' },
  { value: 'deleted', label: 'Deleted (trash)' },
  { value: 'all', label: 'All forms' },
];

export const FORM_STATUS_OPTIONS: { value: FormStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'CLOSED', label: 'Closed' },
];

const FORM_STATUS_LABELS: Record<FormStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  CLOSED: 'Closed',
};

const FORM_STATUS_HINTS: Record<FormStatus, string> = {
  DRAFT: 'Not published — only visible to the owner',
  PUBLISHED: 'Live and accepting responses',
  ARCHIVED: 'Archived and hidden from the public',
  CLOSED: 'Closed — no longer accepting responses',
};

const FORM_TYPE_LABELS: Record<FormType, string> = {
  CONTACT: 'Contact',
  SURVEY: 'Survey',
  REGISTRATION: 'Registration',
  ORDER: 'Order',
  FEEDBACK: 'Feedback',
  QUIZ: 'Quiz',
  APPLICATION: 'Application',
  OTHER: 'Other',
};

export function formatFormStatus(status: FormStatus | string): string {
  return FORM_STATUS_LABELS[status as FormStatus] ?? status;
}

export function formStatusHint(status: FormStatus | string): string {
  return FORM_STATUS_HINTS[status as FormStatus] ?? formatFormStatus(status);
}

export function formMetricHint(metric: 'submissions' | 'views', value: number): string {
  const label = metric === 'submissions' ? 'submissions' : 'views';
  if (value === 0) {
    return metric === 'submissions' ? 'No submissions yet' : 'No views yet';
  }
  return `${value.toLocaleString('en-US')} total ${label}`;
}

export function formatFormType(type: FormType | string): string {
  return FORM_TYPE_LABELS[type as FormType] ?? type;
}

export function formStatusChipColor(
  status: FormStatus | string,
): 'success' | 'default' | 'warning' | 'danger' | 'accent' {
  switch (status) {
    case 'PUBLISHED':
      return 'success';
    case 'DRAFT':
      return 'accent';
    case 'CLOSED':
      return 'warning';
    case 'ARCHIVED':
      return 'danger';
    default:
      return 'default';
  }
}

export function formatFormDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFormDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export function formatFieldType(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function displayOwnerName(
  name: string | null | undefined,
  email: string,
): string {
  const trimmed = name?.trim();
  if (trimmed && !trimmed.includes('@')) return trimmed;
  if (trimmed && trimmed !== email) return trimmed;
  return email;
}

export function truncateEmail(email: string, maxLength = 28): string {
  if (email.length <= maxLength) return email;
  const at = email.indexOf('@');
  if (at <= 0) return `${email.slice(0, maxLength - 1)}…`;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const budget = maxLength - domain.length - 2;

  if (budget >= 6) {
    return `${local.slice(0, budget)}…@${domain}`;
  }

  return `${email.slice(0, maxLength - 1)}…`;
}

function isTestOwnerEmail(email: string): boolean {
  return email.includes('e2e-') || email.endsWith('@rukny.test');
}

/** Primary line for owner column — avoids duplicating long test emails. */
export function formatOwnerPrimary(owner: {
  name: string | null;
  username: string | null;
  email: string;
}): string {
  const name = owner.name?.trim();
  if (name && !name.includes('@')) return name;
  if (owner.username) return `@${owner.username}`;
  if (isTestOwnerEmail(owner.email)) return 'Test account';
  return truncateEmail(owner.email);
}

/** Secondary line for owner column; null when redundant. */
export function formatOwnerSecondary(owner: {
  name: string | null;
  username: string | null;
  email: string;
}): string | null {
  const name = owner.name?.trim();
  if (name && !name.includes('@')) return truncateEmail(owner.email);
  if (owner.username && (!name || name.includes('@'))) return truncateEmail(owner.email);
  if (isTestOwnerEmail(owner.email)) return truncateEmail(owner.email);
  return null;
}

export function formatFormMetric(value: number): string {
  if (value === 0) return '—';
  return value.toLocaleString('en-US');
}
