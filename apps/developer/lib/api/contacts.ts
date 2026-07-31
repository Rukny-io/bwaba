import { api } from '@/lib/api-client';
import type { ContactsPage, DeveloperContact } from '@/lib/api/types';

export async function listContacts(params?: {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<ContactsPage> {
  const { data } = await api.get<ContactsPage>('/developer/contacts', params);
  return data;
}

export async function createContact(body: {
  name: string;
  phoneNumber: string;
  tags?: string[];
}): Promise<DeveloperContact> {
  const { data } = await api.post<DeveloperContact>('/developer/contacts', body);
  return data;
}

export async function updateContact(
  id: string,
  body: { name?: string; phoneNumber?: string; tags?: string[] },
): Promise<DeveloperContact> {
  const { data } = await api.patch<DeveloperContact>(
    `/developer/contacts/${id}`,
    body,
  );
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/developer/contacts/${id}`);
}
