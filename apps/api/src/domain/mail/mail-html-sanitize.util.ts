const BLOCKED_TAGS =
  /<\/?(?:script|style|iframe|object|embed|form|input|button|link|meta|base)[^>]*>/gi;
const EVENT_HANDLERS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_URL = /\s+(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

/**
 * Strip dangerous HTML before storing or sending mail bodies.
 * Keeps common formatting tags produced by the webmail editor.
 */
export function sanitizeMailHtml(html: string | undefined | null): string | undefined {
  if (!html) return undefined;
  let cleaned = html
    .replace(BLOCKED_TAGS, '')
    .replace(EVENT_HANDLERS, '')
    .replace(JAVASCRIPT_URL, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  return cleaned.trim() || undefined;
}
