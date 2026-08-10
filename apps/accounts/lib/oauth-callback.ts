export {
  clearOAuthHash,
  clearOAuthParamsFromUrl,
  clearStashedOAuthParams,
  readOAuthCallbackParams,
  readStashedOAuthParams,
  stashOAuthParams,
  type OAuthCallbackParams,
} from '@rukny/auth/client/oauth-callback';

/**
 * When handing off to another app, pass the final in-app path — not another /callback URL.
 */
export function resolveCrossAppForwardNext(
  resolvedTarget: string,
  targetOrigin: string,
): string {
  try {
    const url = new URL(resolvedTarget);
    if (url.origin === targetOrigin && url.pathname === '/callback') {
      const inner = url.searchParams.get('next');
      if (inner) {
        return resolveCrossAppForwardNext(inner, targetOrigin);
      }
      return '/app';
    }
    if (url.origin === targetOrigin) {
      return url.pathname + url.search;
    }
    return resolvedTarget;
  } catch {
    if (resolvedTarget.startsWith('/')) return resolvedTarget;
    return '/app';
  }
}
