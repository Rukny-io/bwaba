import type { FormsListQuery } from '@/lib/types/forms';

export const FORMS_DEFAULT_LIMIT = 10;

export function parseFormsQuery(
  params: URLSearchParams,
): Required<Pick<FormsListQuery, 'page' | 'limit'>> & FormsListQuery {
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      Number(params.get('limit') || String(FORMS_DEFAULT_LIMIT)) || FORMS_DEFAULT_LIMIT,
    ),
  );

  return {
    page,
    limit,
    search: params.get('search')?.trim() || undefined,
    status: (params.get('status') as FormsListQuery['status']) || undefined,
    visibility:
      (params.get('visibility') as FormsListQuery['visibility']) || undefined,
  };
}

export function buildFormsSearchParams(
  query: FormsListQuery,
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
    query.limit && query.limit !== FORMS_DEFAULT_LIMIT ? query.limit : undefined,
  );
  setOrDelete('search', query.search);
  setOrDelete('status', query.status);
  setOrDelete('visibility', query.visibility);

  return params;
}

export function formsQueryToApiParams(
  query: FormsListQuery,
): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? FORMS_DEFAULT_LIMIT,
    search: query.search,
    status: query.status || undefined,
    visibility: query.visibility || undefined,
  };
}
