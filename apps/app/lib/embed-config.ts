const DEFAULT_PUBLIC_ORIGIN = 'https://rukny.io';
const DEFAULT_EMBED_SLUG = 'ku0h3r';

export function getEmbedConfig() {
  const publicOrigin = (
    process.env.NEXT_PUBLIC_FORM_PUBLIC_ORIGIN ?? DEFAULT_PUBLIC_ORIGIN
  ).replace(/\/$/, '');
  const slug = process.env.NEXT_PUBLIC_EMBED_FORM_SLUG ?? DEFAULT_EMBED_SLUG;

  return {
    slug,
    publicOrigin,
    embedUrl: `${publicOrigin}/f/${encodeURIComponent(slug)}?embed=1`,
  };
}
