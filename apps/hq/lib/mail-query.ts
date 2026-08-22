import type { MailAppsListQuery, MailWorkspaceTab } from '@/lib/types/mail';

export const MAIL_DEFAULT_LIMIT = 10;

const TABS: MailWorkspaceTab[] = [
  'analytics',
  'domains',
  'review',
  'delivery',
  'alerts',
];

export function parseMailQuery(
  params: URLSearchParams,
): Required<Pick<MailAppsListQuery, 'page' | 'limit' | 'tab'>> & MailAppsListQuery {
  const page = Math.max(1, Number(params.get('page') || '1') || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      Number(params.get('limit') || String(MAIL_DEFAULT_LIMIT)) || MAIL_DEFAULT_LIMIT,
    ),
  );
  const tabParam = params.get('tab') as MailWorkspaceTab | null;
  const tab = tabParam && TABS.includes(tabParam) ? tabParam : 'review';

  return {
    page,
    limit,
    tab,
    search: params.get('search')?.trim() || undefined,
    status: (params.get('status') as MailAppsListQuery['status']) || undefined,
    plan: (params.get('plan') as MailAppsListQuery['plan']) || undefined,
    domainStatus:
      (params.get('domainStatus') as MailAppsListQuery['domainStatus']) || undefined,
  };
}

export function buildMailSearchParams(
  query: MailAppsListQuery,
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
    query.limit && query.limit !== MAIL_DEFAULT_LIMIT ? query.limit : undefined,
  );
  setOrDelete('tab', query.tab && query.tab !== 'review' ? query.tab : undefined);
  setOrDelete('search', query.search);
  setOrDelete('status', query.status);
  setOrDelete('plan', query.plan);
  setOrDelete('domainStatus', query.domainStatus);

  return params;
}

export function mailQueryToApiParams(
  query: MailAppsListQuery,
): Record<string, string | number | undefined> {
  return {
    page: query.page ?? 1,
    limit: query.limit ?? MAIL_DEFAULT_LIMIT,
    search: query.search,
    status: query.status || undefined,
    plan: query.plan || undefined,
    domainStatus: query.domainStatus || undefined,
  };
}
