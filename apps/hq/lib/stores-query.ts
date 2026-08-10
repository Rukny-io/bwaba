import type { StoresListQuery } from '@/lib/types/stores';

export const STORES_DEFAULT_LIMIT = 20;

export function parseStoresQuery(
  params: URLSearchParams,
): Required<Pick<StoresListQuery, 'page' | 'limit'>> & StoresListQuery {
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      Number(params.get('limit') || String(STORES_DEFAULT_LIMIT)) || STORES_DEFAULT_LIMIT,
    ),
  );

  return {
    page,
    limit,
    search: params.get('search')?.trim() || undefined,
    status: (params.get('status') as StoresListQuery['status']) || undefined,
    categoryId: params.get('categoryId')?.trim() || undefined,
    city: params.get('city')?.trim() || undefined,
  };
}

export function buildStoresSearchParams(
  query: StoresListQuery,
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
  setOrDelete(
    'limit',
    query.limit && query.limit !== STORES_DEFAULT_LIMIT ? query.limit : undefined,
  );
  setOrDelete('search', query.search);
  setOrDelete('status', query.status);
  setOrDelete('categoryId', query.categoryId);
  setOrDelete('city', query.city);

  return params;
}

export function storesQueryToApiParams(
  query: StoresListQuery,
): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? STORES_DEFAULT_LIMIT,
    search: query.search,
    status: query.status || undefined,
    categoryId: query.categoryId || undefined,
    city: query.city || undefined,
  };
}
