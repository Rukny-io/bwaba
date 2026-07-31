export const THMANYAH_SANS =
  'var(--font-thmanyah-sans), "Thmanyah Sans", system-ui, -apple-system, "Segoe UI", sans-serif' as const;

/** @deprecated Use THMANYAH_SANS */
export const IBM_PLEX_SANS_ARABIC = THMANYAH_SANS;

const LOCAL_FONT_STACKS: Record<string, string> = {
  'Thmanyah Sans': THMANYAH_SANS,
};

/** Maps theme fontFamily to a CSS stack (local fonts use next/font variables). */
export function resolveFontStack(fontFamily: string): string {
  return LOCAL_FONT_STACKS[fontFamily] ?? `"${fontFamily}", system-ui, sans-serif`;
}
