import { api } from '@/lib/api-client';

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

export interface FormFieldPayload {
  label: string;
  type: string;
  order: number;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
}

export interface FormListItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: FormType;
  status: FormStatus;
  coverImage?: string | null;
  updatedAt: string;
}

export interface FormDetail extends FormListItem {
  fields?: FormFieldPayload[];
}

export interface CreateFormPayload {
  title: string;
  slug?: string;
  type: FormType;
  description?: string;
  status?: FormStatus;
  fields?: FormFieldPayload[];
}

export interface FormsListResponse {
  forms: FormListItem[];
  pagination: { total: number; hasMore?: boolean };
}

export async function listMyForms(params?: {
  status?: FormStatus;
  limit?: number;
}): Promise<FormsListResponse> {
  const { data } = await api.get<FormsListResponse>('/forms', {
    status: params?.status,
    limit: params?.limit ?? 50,
  });
  return data;
}

export async function createForm(payload: CreateFormPayload): Promise<FormDetail> {
  const { data } = await api.post<FormDetail>('/forms', payload);
  return data;
}

export async function publishForm(id: string): Promise<FormDetail> {
  const { data } = await api.put<FormDetail>(`/forms/${encodeURIComponent(id)}/status`, {
    status: 'PUBLISHED',
  });
  return data;
}
