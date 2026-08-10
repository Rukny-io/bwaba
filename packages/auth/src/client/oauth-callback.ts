export interface OAuthCallbackParams {
  code: string | null;
  next: string | null;
}

const PENDING_KEY = 'rukny_oauth_pending';

type PendingOAuth = {
  code: string;
  next: string | null;
  ts: number;
};

function readHashParams(): OAuthCallbackParams {
  if (typeof window === 'undefined') {
    return { code: null, next: null };
  }

  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) {
    return { code: null, next: null };
  }

  const fragment = new URLSearchParams(hash);
  return {
    code: fragment.get('code'),
    next: fragment.get('next'),
  };
}

function isHandoffCode(code: string | null | undefined): code is string {
  return Boolean(code && /^[a-f0-9]{64,128}$/i.test(code));
}

/** Read OAuth one-time code from query (?code=) or URL fragment (#code=). */
export function readOAuthCallbackParams(
  searchParams: URLSearchParams,
): OAuthCallbackParams {
  const hash = readHashParams();
  const queryCode = searchParams.get('code');
  const queryNext = searchParams.get('next');

  const queryLooksValid = isHandoffCode(queryCode);
  const hashLooksValid = isHandoffCode(hash.code);

  if (hashLooksValid && queryLooksValid && hash.code !== queryCode) {
    return { code: hash.code, next: hash.next || queryNext };
  }

  if (queryLooksValid) {
    return { code: queryCode, next: queryNext || hash.next };
  }

  if (hashLooksValid) {
    return { code: hash.code, next: hash.next || queryNext };
  }

  if (queryCode) {
    return { code: queryCode, next: queryNext || hash.next };
  }

  if (hash.code) {
    return { code: hash.code, next: hash.next || queryNext };
  }

  return { code: null, next: queryNext || hash.next };
}

/** Persist the one-time code so Strict Mode remounts cannot lose it. */
export function stashOAuthParams(params: {
  code: string;
  next: string | null;
}): void {
  if (typeof window === 'undefined') return;
  const payload: PendingOAuth = {
    code: params.code,
    next: params.next,
    ts: Date.now(),
  };
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function readStashedOAuthParams(): OAuthCallbackParams {
  if (typeof window === 'undefined') {
    return { code: null, next: null };
  }
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return { code: null, next: null };
    const parsed = JSON.parse(raw) as PendingOAuth;
    if (!parsed?.code || Date.now() - parsed.ts > 10 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_KEY);
      return { code: null, next: null };
    }
    return { code: parsed.code, next: parsed.next ?? null };
  } catch {
    return { code: null, next: null };
  }
}

export function clearStashedOAuthParams(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** Remove one-time code from the address bar (query + hash). */
export function clearOAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('code');
  const search = url.searchParams.toString();
  window.history.replaceState(
    null,
    '',
    `${url.pathname}${search ? `?${search}` : ''}`,
  );
}

/** @deprecated Prefer clearOAuthParamsFromUrl */
export function clearOAuthHash(): void {
  clearOAuthParamsFromUrl();
}
