export interface OAuthCallbackParams {
  code: string | null;
  next: string | null;
}

/** Read OAuth one-time code from query (?code=) or URL fragment (#code=). */
export function readOAuthCallbackParams(
  searchParams: URLSearchParams,
): OAuthCallbackParams {
  const queryCode = searchParams.get('code');
  if (queryCode) {
    return {
      code: queryCode,
      next: searchParams.get('next'),
    };
  }

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

export function clearOAuthHash(): void {
  if (typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}`);
}
