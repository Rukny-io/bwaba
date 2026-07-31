import { api } from '@/lib/api-client';
import type { FormTheme } from '@/lib/form-theme';

export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type FormType =
  | 'CONTACT'
  | 'SURVEY'
  | 'REGISTRATION'
  | 'ORDER'
  | 'FEEDBACK'
  | 'QUIZ'
  | 'APPLICATION'
  | 'OTHER';

export interface FormCounts {
  fields: number;
  submissions: number;
}

export interface FormSharedWorkspace {
  id: string;
  name: string;
  role?: string;
  avatar?: string | null;
}

export interface FormListItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: FormType;
  status: FormStatus;
  userId?: string;
  isShared?: boolean;
  sharedWorkspace?: FormSharedWorkspace | null;
  viewCount?: number;
  submissionCount?: number;
  coverImage?: string | null;
  requiresAuthentication?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  purgeScheduledAt?: string | null;
  deletionReason?: string | null;
  _count?: FormCounts;
}

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
}

export interface FormFieldPayload {
  id?: string;
  label: string;
  type: string;
  order: number;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: unknown;
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  validationRules?: unknown;
  conditionalLogic?: unknown;
}

export interface FormStepFieldPayload extends FormFieldPayload {
  id?: string;
}

export interface FormStepPayload {
  title: string;
  description?: string;
  order: number;
  fields: FormStepFieldPayload[];
}

export interface FormStepRow {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  form_fields?: FormField[];
  fields?: FormField[];
}

export interface FormDetail extends FormListItem {
  isMultiStep?: boolean;
  allowMultipleSubmissions?: boolean;
  requiresAuthentication?: boolean;
  requireTurnstileOnSubmit?: boolean;
  oneResponsePerUser?: boolean;
  submissionLimit?: number | null;
  maxSubmissions?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
  closeAfterDate?: boolean;
  showProgressBar?: boolean;
  coverImage?: string | null;
  theme?: FormTheme | Record<string, unknown> | null;
  fields?: FormField[];
  steps?: FormStepRow[];
  webhookEnabled?: boolean;
  webhookUrl?: string | null;
  webhookEvents?: string[];
  notifyOnSubmission?: boolean;
  notificationEmail?: string | null;
}

export interface FormsPagination {
  total: number;
  page?: number;
  limit?: number;
  pages?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
}

export interface FormsListResponse {
  forms: FormListItem[];
  pagination: FormsPagination;
}

/** يحافظ على بيانات المشاركة بعد تحديثات الـ API التي لا تُرجعها دائماً */
export function withFormSharingMeta(
  updated: FormDetail,
  previous: FormDetail | null | undefined,
): FormDetail {
  if (!previous?.isShared) return updated;
  return {
    ...updated,
    userId: updated.userId ?? previous.userId,
    isShared: previous.isShared,
    sharedWorkspace: previous.sharedWorkspace ?? null,
  };
}

export interface CreateFormPayload {
  title: string;
  /** Omitted → API assigns unique 6-char slug (a-z, 0-9). */
  slug?: string;
  type: FormType;
  description?: string;
  status?: FormStatus;
  fields?: FormFieldPayload[];
}

export interface UpdateFormPayload {
  title?: string;
  slug?: string;
  description?: string;
  type?: FormType;
  coverImage?: string | null;
  theme?: FormTheme | Record<string, unknown>;
  fields?: FormFieldPayload[];
  allowMultipleSubmissions?: boolean;
  requiresAuthentication?: boolean;
  requireTurnstileOnSubmit?: boolean;
  oneResponsePerUser?: boolean;
  submissionLimit?: number;
  opensAt?: string;
  closesAt?: string;
  closeAfterDate?: boolean;
  isMultiStep?: boolean;
  showProgressBar?: boolean;
  webhookEnabled?: boolean;
  webhookUrl?: string;
  webhookEvents?: string[];
  notifyOnSubmission?: boolean;
  notificationEmail?: string;
}

export interface PresignFileInfo {
  name: string;
  type: string;
  size: number;
}

export interface PresignUploadResult {
  key: string;
  url: string;
}

export interface FormSubmissionUser {
  id: string;
  email?: string;
  profile?: { name?: string | null } | null;
}

export interface FormSubmission {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
  user?: FormSubmissionUser | null;
}

export interface SubmissionsListResponse {
  submissions: FormSubmission[];
  pagination: FormsPagination;
  nextCursor?: string;
}

export interface FormAnalyticsSummary {
  totalViews: number;
  totalSubmissions: number;
  completionRate: number;
  avgTimeToComplete: number;
  firstSubmission: string | null;
  lastSubmission: string | null;
  viewsTrend?: number;
  submissionsTrend?: number;
  completionRateTrend?: number;
}

export interface FormAnalyticsIntro {
  fieldCount: number;
  requiredFieldCount: number;
  avgFieldCompletionRate: number;
  formStatus: string;
}

export interface FormAnalyticsVisits {
  totalShares: number;
  sharesTrend?: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  views: number;
  submissions: number;
}

export interface AnalyticsDeviceItem {
  deviceType: string;
  views: number;
  submissions: number;
  percentage: number;
}

export interface FormAnalyticsFieldStat {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  totalResponses: number;
  skipped: number;
  responseRate: number;
  topValues: { value: string; count: number }[];
}

export interface FormAnalyticsDropOff {
  fieldId: string;
  fieldLabel: string;
  fieldOrder: number;
  answered: number;
  skipped: number;
  responseRate: number;
}

export interface FormAnalyticsNps {
  fieldId: string;
  fieldLabel: string;
  responses: number;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  distribution: { value: number; count: number }[];
}

export interface FormAnalyticsResponse {
  form?: { id: string; title: string; slug: string; status: string };
  period?: { days: number; startDate: string; endDate: string };
  intro?: FormAnalyticsIntro;
  visits?: FormAnalyticsVisits;
  summary: FormAnalyticsSummary;
  dailyTrend?: AnalyticsTrendPoint[];
  submissionsByDay: { date: string; count: number }[];
  fieldAnalytics: FormAnalyticsFieldStat[];
  dropOffRate: FormAnalyticsDropOff[];
  nps?: FormAnalyticsNps | null;
  deviceBreakdown?: AnalyticsDeviceItem[];
  geoBreakdown?: AnalyticsGeoBreakdown;
}

export interface AnalyticsOverviewFormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  type: string;
  views: number;
  submissions: number;
  completionRate: number;
  totalViews: number;
  totalSubmissions: number;
  updatedAt: string;
}

export interface AnalyticsGeoRegion {
  code: string;
  name: string;
  nameAr?: string;
  views: number;
  submissions: number;
}

export interface AnalyticsGeoBreakdown {
  governorates: AnalyticsGeoRegion[];
  countries: AnalyticsGeoRegion[];
  cities?: AnalyticsGeoCity[];
  maxViews: number;
  maxSubmissions: number;
}

export interface AnalyticsGeoCity {
  name: string;
  countryCode: string;
  views: number;
  submissions: number;
}

export interface AnalyticsOverviewResponse {
  period: { days: number; startDate: string; endDate: string };
  summary: {
    views: number;
    submissions: number;
    completionRate: number;
    avgTimeToComplete: number;
    viewsTrend: number;
    submissionsTrend: number;
    completionRateTrend: number;
  };
  dailyTrend: AnalyticsTrendPoint[];
  topForms: {
    id: string;
    title: string;
    slug: string;
    submissions: number;
    views: number;
    completionRate: number;
  }[];
  needsAttention: {
    id: string;
    title: string;
    slug: string;
    reason: string;
  }[];
  deviceBreakdown: AnalyticsDeviceItem[];
  geoBreakdown: AnalyticsGeoBreakdown;
  forms: AnalyticsOverviewFormRow[];
}

export interface ListFormsParams {
  page?: number;
  limit?: number;
  status?: FormStatus;
  type?: FormType;
  visibility?: 'active' | 'deleted' | 'all';
}

export interface SoftDeleteFormResult {
  id: string;
  deletedAt: string;
  purgeScheduledAt: string;
  submissionCount: number;
  retentionDays: number;
}

export interface ListSubmissionsParams {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
}

export interface FieldDistributionItem {
  name: string;
  count: number;
  percentage: number;
}

export interface FieldSubmissionSummary {
  fieldId: string;
  label: string;
  type: string;
  totalResponses: number;
  options?: unknown;
  distribution?: FieldDistributionItem[];
  average?: number;
  min?: number;
  max?: number;
  textResponses?: string[];
  /** Raw signature values (data URL or S3 url object) — not plain text */
  signatureResponses?: unknown[];
  fileResponses?: unknown[];
}

export interface SubmissionsSummaryResponse {
  formId: string;
  formTitle: string;
  totalSubmissions: number;
  fields: FieldSubmissionSummary[];
}

export interface FieldResponseCountsResponse {
  formId: string;
  totalSubmissions: number;
  counts: Record<string, number>;
}

export async function listForms(
  params?: ListFormsParams,
): Promise<FormsListResponse> {
  const { data } = await api.get<FormsListResponse>(
    '/forms',
    params as Record<string, string | number | boolean | undefined>,
  );
  return data;
}

export async function getForm(idOrSlug: string): Promise<FormDetail> {
  const { data } = await api.get<FormDetail>(
    `/forms/${encodeURIComponent(idOrSlug)}`,
  );
  return data;
}

export async function createForm(
  payload: CreateFormPayload,
): Promise<FormDetail> {
  const { data } = await api.post<FormDetail>('/forms', payload);
  return data;
}

export async function updateForm(
  id: string,
  payload: UpdateFormPayload,
): Promise<FormDetail> {
  const { data } = await api.put<FormDetail>(
    `/forms/${encodeURIComponent(id)}`,
    payload,
  );
  return data;
}

export async function getFormSteps(formId: string): Promise<FormStepRow[]> {
  const { data } = await api.get<FormStepRow[]>(
    `/forms/${encodeURIComponent(formId)}/steps`,
  );
  return data;
}

export async function updateFormSteps(
  formId: string,
  steps: FormStepPayload[],
): Promise<FormStepRow[]> {
  const { data } = await api.put<FormStepRow[]>(
    `/forms/${encodeURIComponent(formId)}/steps`,
    { steps },
  );
  return data;
}

export async function updateFormStatus(
  id: string,
  status: FormStatus,
): Promise<FormDetail> {
  const { data } = await api.put<FormDetail>(
    `/forms/${encodeURIComponent(id)}/status`,
    { status },
  );
  return data;
}

export async function deleteForm(
  id: string,
  payload: { confirmTitle: string; reason?: string },
): Promise<SoftDeleteFormResult> {
  const { data } = await api.post<SoftDeleteFormResult>(
    `/forms/${encodeURIComponent(id)}/delete`,
    payload,
  );
  return data;
}

export async function restoreForm(
  id: string,
  confirmTitle: string,
): Promise<{ id: string; restored: boolean }> {
  const { data } = await api.post<{ id: string; restored: boolean }>(
    `/forms/${encodeURIComponent(id)}/restore`,
    { confirmTitle },
  );
  return data;
}

export async function duplicateForm(id: string): Promise<FormDetail> {
  const { data } = await api.post<FormDetail>(
    `/forms/${encodeURIComponent(id)}/duplicate`,
  );
  return data;
}

export async function listSubmissions(
  formId: string,
  params?: ListSubmissionsParams,
): Promise<SubmissionsListResponse> {
  const { data } = await api.get<SubmissionsListResponse>(
    `/forms/${encodeURIComponent(formId)}/submissions`,
    params as Record<string, string | number | boolean | undefined>,
  );
  return data;
}

export async function deleteSubmission(
  formId: string,
  submissionId: string,
): Promise<void> {
  await api.delete(
    `/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
  );
}

export async function getSubmissionsSummary(
  formId: string,
): Promise<SubmissionsSummaryResponse> {
  const { data } = await api.get<SubmissionsSummaryResponse>(
    `/forms/${encodeURIComponent(formId)}/submissions/summary`,
  );
  return data;
}

export async function getFieldResponseCounts(
  formId: string,
): Promise<FieldResponseCountsResponse> {
  const { data } = await api.get<FieldResponseCountsResponse>(
    `/forms/${encodeURIComponent(formId)}/submissions/field-response-counts`,
  );
  return data;
}

/** Download submissions as CSV (UTF-8 with BOM from API). */
export async function exportSubmissionsCsv(formId: string): Promise<void> {
  const url = `/api/v1/forms/${encodeURIComponent(formId)}/export`;
  let response = await fetch(url, { credentials: 'include' });

  if (response.status === 401) {
    const { refreshOnce } = await import('@/lib/api-client');
    const refreshed = await refreshOnce();
    if (refreshed.success) {
      response = await fetch(url, { credentials: 'include' });
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || 'تعذّر تصدير الاستجابات';
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? `submissions-${formId}.csv`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/** Download orphaned (deleted-field) submission data as CSV — Plus plan and above. */
export async function exportOrphanedSubmissionsCsv(formId: string): Promise<void> {
  const url = `/api/v1/forms/${encodeURIComponent(formId)}/export/orphaned`;
  let response = await fetch(url, { credentials: 'include' });

  if (response.status === 401) {
    const { refreshOnce } = await import('@/lib/api-client');
    const refreshed = await refreshOnce();
    if (refreshed.success) {
      response = await fetch(url, { credentials: 'include' });
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || 'تعذّر تصدير الاستجابات المحذوفة';
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? `orphaned-submissions-${formId}.csv`;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function getFormAnalytics(
  formId: string,
  days = 30,
): Promise<FormAnalyticsResponse> {
  const { data } = await api.get<FormAnalyticsResponse>(
    `/forms/${encodeURIComponent(formId)}/analytics`,
    { days },
  );
  return data;
}

export async function recordFormShare(formId: string): Promise<void> {
  await api.post(`/forms/${encodeURIComponent(formId)}/analytics/share`);
}

export async function getAnalyticsOverview(
  days = 30,
): Promise<AnalyticsOverviewResponse> {
  const { data } = await api.get<AnalyticsOverviewResponse>(
    '/forms/analytics/overview',
    { days },
  );
  return data;
}

export async function presignFormImageUpload(
  formId: string,
  file: PresignFileInfo,
): Promise<PresignUploadResult> {
  const { data } = await api.post<PresignUploadResult[]>(
    `/forms/${encodeURIComponent(formId)}/upload/presign`,
    { files: [file] },
  );
  const list = Array.isArray(data) ? data : [data];
  const first = list[0];
  if (!first?.key || !first?.url) {
    throw new Error('تعذّر تجهيز رفع الصورة');
  }
  return first;
}

export async function confirmFormImageUpload(
  formId: string,
  keys: string[],
): Promise<void> {
  await api.post(`/forms/${encodeURIComponent(formId)}/upload/confirm`, {
    keys,
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('تعذّر قراءة الملف'));
    };
    reader.onerror = () => reject(new Error('تعذّر قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload cover: API validates → Sharp re-encodes → stores WebP on S3.
 * Avoids direct browser→S3 presigned PUT (CORS); security runs server-side before S3.
 */
export async function uploadFormCoverImage(
  formId: string,
  file: File,
): Promise<FormDetail> {
  const dataUrl = await readFileAsDataUrl(file);
  return updateForm(formId, { coverImage: dataUrl });
}
