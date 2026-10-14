/** Browser mutation guard for Next BFF routes.
 * Browser mutations must carry an Origin matching the current request origin
 * or the explicitly configured public Mail origin.
 */
export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  let originUrl: URL;
  let requestUrl: URL;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(request.url);
  } catch {
    return false;
  }

  if (originUrl.origin === requestUrl.origin) return true;

  const configured = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_MAIL_URL,
  ].filter(Boolean);
  return configured.some((value) => {
    try {
      return new URL(value as string).origin === originUrl.origin;
    } catch {
      return false;
    }
  });
}
