import type { FormTheme } from '@/lib/form-theme';

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface FormField {
  id: string;
  label: string;
  type: string;
  order: number;
  required?: boolean;
  placeholder?: string | null;
  description?: string | null;
  options?: unknown;
  minValue?: number | null;
  maxValue?: number | null;
  minLabel?: string | null;
  maxLabel?: string | null;
  conditionalLogic?: unknown;
  validationRules?: unknown;
  allowedFileTypes?: string[];
  maxFileSize?: number | null;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  form_fields?: { id: string; order: number }[];
  fields?: { id: string; order: number }[];
}

export interface PublicForm {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: FormStatus;
  coverImage?: string | null;
  theme?: FormTheme | Record<string, unknown> | null;
  fields?: FormField[];
  steps?: FormStep[];
  isMultiStep?: boolean;
  showProgressBar?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  allowMultipleSubmissions?: boolean;
  requireTurnstileOnSubmit?: boolean;
  /** Whether to show the Rukny branding badge (free plan owners) */
  showBranding?: boolean;
  thankYouTitle?: string | null;
  thankYouMessage?: string | null;
}

export interface SubmitFormPayload {
  data: Record<string, unknown>;
  timeToComplete?: number;
  userAgent?: string;
  turnstileToken?: string;
}
