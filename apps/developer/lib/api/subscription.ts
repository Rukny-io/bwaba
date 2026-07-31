import { api } from '@/lib/api-client';
import type { DeveloperSubscription } from '@/lib/api/types';

export async function getSubscription(): Promise<DeveloperSubscription> {
  const { data } = await api.get<DeveloperSubscription>(
    '/developer/subscription',
  );
  return data;
}
