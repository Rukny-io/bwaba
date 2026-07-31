import type { UsersListQuery } from '@/lib/types/users';

export const USERS_DEFAULT_LIMIT = 10;

export function parseUsersQuery(
  params: URLSearchParams,
): Required<Pick<UsersListQuery, 'page' | 'limit'>> & UsersListQuery {
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(params.get('limit') || String(USERS_DEFAULT_LIMIT)) || USERS_DEFAULT_LIMIT),
  );

  return {
    page,
    limit,
    search: params.get('search')?.trim() || undefined,
    role: (params.get('role') as UsersListQuery['role']) || undefined,
    emailVerified:
      (params.get('emailVerified') as UsersListQuery['emailVerified']) || undefined,
    startDate: params.get('startDate') || undefined,
    endDate: params.get('endDate') || undefined,
    verificationLevel:
      (params.get('verificationLevel') as UsersListQuery['verificationLevel']) ||
      undefined,
    isRuknyVerified:
      (params.get('isRuknyVerified') as UsersListQuery['isRuknyVerified']) ||
      undefined,
    twoFactorEnabled:
      (params.get('twoFactorEnabled') as UsersListQuery['twoFactorEnabled']) ||
      undefined,
    phoneVerified:
      (params.get('phoneVerified') as UsersListQuery['phoneVerified']) ||
      undefined,
    isDeactivated:
      (params.get('isDeactivated') as UsersListQuery['isDeactivated']) ||
      undefined,
  };
}

export function buildUsersSearchParams(
  query: UsersListQuery,
  base?: URLSearchParams,
): URLSearchParams {
  const params = new URLSearchParams(base?.toString());

  const setOrDelete = (key: string, value?: string | number) => {
    if (value === undefined || value === '' || value === null) {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  };

  setOrDelete('page', query.page && query.page > 1 ? query.page : undefined);
  setOrDelete('limit', query.limit && query.limit !== USERS_DEFAULT_LIMIT ? query.limit : undefined);
  setOrDelete('search', query.search);
  setOrDelete('role', query.role);
  setOrDelete('emailVerified', query.emailVerified);
  setOrDelete('startDate', query.startDate);
  setOrDelete('endDate', query.endDate);
  setOrDelete('verificationLevel', query.verificationLevel);
  setOrDelete('isRuknyVerified', query.isRuknyVerified);
  setOrDelete('twoFactorEnabled', query.twoFactorEnabled);
  setOrDelete('phoneVerified', query.phoneVerified);
  setOrDelete('isDeactivated', query.isDeactivated);

  return params;
}

export function usersQueryToApiParams(
  query: UsersListQuery,
): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? USERS_DEFAULT_LIMIT,
    search: query.search,
    role: query.role || undefined,
    emailVerified: query.emailVerified || undefined,
    startDate: query.startDate,
    endDate: query.endDate,
    verificationLevel: query.verificationLevel || undefined,
    isRuknyVerified: query.isRuknyVerified || undefined,
    twoFactorEnabled: query.twoFactorEnabled || undefined,
    phoneVerified: query.phoneVerified || undefined,
    isDeactivated: query.isDeactivated || undefined,
  };
}
