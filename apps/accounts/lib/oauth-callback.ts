export interface OAuthCallbackParams {
  code: string | null;
  next: string | null;
}

/** Read OAuth one-time code from query (?code=) or URL fragment (#code=). */
export function readOAuthCallbackParams(
  searchParams: URLSearchParams,
): OAuthCallbackParams {
  const queryCode = searchParams.get("code");
  if (queryCode) {
    return {
      code: queryCode,
      next: searchParams.get("next"),
    };
  }

  if (typeof window === "undefined") {
    return { code: null, next: null };
  }

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    return { code: null, next: null };
  }

  const fragment = new URLSearchParams(hash);
  return {
    code: fragment.get("code"),
    next: fragment.get("next"),
  };
}

export function clearOAuthHash(): void {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(null, "", `${pathname}${search}`);
}

/**
 * When handing off to another app, pass the final in-app path — not another /callback URL.
 */
export function resolveCrossAppForwardNext(
  resolvedTarget: string,
  targetOrigin: string,
): string {
  try {
    const url = new URL(resolvedTarget);
    if (url.origin === targetOrigin && url.pathname === "/callback") {
      const inner = url.searchParams.get("next");
      if (inner) {
        return resolveCrossAppForwardNext(inner, targetOrigin);
      }
      return "/app";
    }
    if (url.origin === targetOrigin) {
      return url.pathname + url.search;
    }
    return resolvedTarget;
  } catch {
    if (resolvedTarget.startsWith("/")) return resolvedTarget;
    return "/app";
  }
}
