const MAX_EMBED_ORIGINS = 20;

export function parseOriginFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).origin;
  } catch {
    return null;
  }
}

function collectDeveloperPortalOrigins(): string[] {
  const candidates = [
    process.env.DEVELOPERS_FRONTEND_URL,
    process.env.DEVELOPER_PORTAL_URL,
  ];
  if (process.env.NODE_ENV !== 'production') {
    candidates.push('http://localhost:3004', 'http://127.0.0.1:3004');
  }

  const set = new Set<string>();
  for (const url of candidates) {
    const origin = parseOriginFromUrl(url);
    if (origin) set.add(origin);
  }
  return [...set];
}

/** Normalize user-provided origins (full URL or host) to canonical origin strings. */
export function normalizeEmbedOrigins(origins: string[]): string[] {
  const set = new Set<string>();

  for (const raw of origins) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const origin = parseOriginFromUrl(candidate);
    if (!origin) continue;

    if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
      continue;
    }

    set.add(origin);
    if (set.size >= MAX_EMBED_ORIGINS) break;
  }

  return [...set];
}

export function buildAllowedEmbedAncestors(app: {
  websiteUrl?: string | null;
  embedAllowedOrigins?: string[] | null;
}): string[] {
  const set = new Set<string>();

  const websiteOrigin = parseOriginFromUrl(app.websiteUrl);
  if (websiteOrigin) set.add(websiteOrigin);

  for (const origin of collectDeveloperPortalOrigins()) {
    set.add(origin);
  }

  return [...set].slice(0, MAX_EMBED_ORIGINS);
}
