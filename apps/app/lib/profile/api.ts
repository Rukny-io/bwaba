import { api } from '@/lib/api-client';
import type { MyProfile } from '@/lib/profile/types';

export async function fetchMyProfile(): Promise<MyProfile | null> {
  try {
    const { data } = await api.get<MyProfile>('/profiles/me');
    return data;
  } catch {
    return null;
  }
}
