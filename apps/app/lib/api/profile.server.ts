import { apiServer } from './server';
import type { UserProfile } from './profile';

export async function getMyProfileServer(): Promise<UserProfile | null> {
  try {
    const { data } = await apiServer<UserProfile>('/profiles/me');
    return data;
  } catch {
    return null;
  }
}
