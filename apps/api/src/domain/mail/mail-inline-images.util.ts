export type InlineImagePart = {
  contentId: string;
  filename: string;
  contentType: string;
  content: Buffer;
};

const DATA_URI_IMG =
  /src\s*=\s*(["'])(data:image\/([a-zA-Z0-9+.-]+);base64,([^"']+))\1/gi;

function extensionForSubtype(subtype: string) {
  const normalized = subtype.toLowerCase();
  if (normalized === 'jpeg' || normalized === 'jpg') return 'jpg';
  if (normalized === 'svg+xml') return 'svg';
  return normalized.replace(/[^a-z0-9]/g, '') || 'img';
}

/**
 * Replace data-URI <img src="..."> with cid: references for MIME inline parts.
 */
export function inlineDataUriImages(html: string | undefined | null): {
  html: string | undefined;
  inlineParts: InlineImagePart[];
} {
  if (!html?.trim()) {
    return { html: html ?? undefined, inlineParts: [] };
  }

  const inlineParts: InlineImagePart[] = [];
  let index = 0;

  const rewritten = html.replace(
    DATA_URI_IMG,
    (_match, quote: string, _full: string, subtype: string, b64: string) => {
      index += 1;
      const contentId = `rukny-img-${index}@inline`;
      const contentType = `image/${subtype}`;
      const content = Buffer.from(b64, 'base64');
      if (!content.length) return _match;
      inlineParts.push({
        contentId,
        filename: `image-${index}.${extensionForSubtype(subtype)}`,
        contentType,
        content,
      });
      return `src=${quote}cid:${contentId}${quote}`;
    },
  );

  return {
    html: rewritten.trim() || undefined,
    inlineParts,
  };
}
