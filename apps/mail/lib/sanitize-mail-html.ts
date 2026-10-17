const BLOCKED_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "link",
  "meta",
  "base",
  "frame",
  "frameset",
  "video",
  "audio",
  "source",
  "track",
  "svg",
  "math",
]);

const ALLOWED_URI_ATTRS = new Set(["href", "src", "background"]);

function isSafeUrl(value: string, attr: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "#") return attr === "href";
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) {
    return false;
  }
  if (lower.startsWith("data:")) {
    return attr === "src" && /^data:image\/(gif|jpeg|jpg|png|webp|svg\+xml)/i.test(trimmed);
  }
  if (lower.startsWith("cid:")) return attr === "src";
  return /^(https?:|mailto:|tel:)/i.test(trimmed);
}

function sanitizeCss(css: string): string {
  return css
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/expression\s*\(/gi, "invalid(")
    .replace(/-moz-binding\s*:/gi, "invalid:")
    .replace(/behavior\s*:/gi, "invalid:")
    .replace(/javascript\s*:/gi, "invalid:")
    .replace(/vbscript\s*:/gi, "invalid:")
    .replace(/url\s*\(\s*['"]?\s*javascript:/gi, "url(about:blank");
}

function stripEventHandlers(el: Element) {
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on") || name === "srcdoc" || name === "formaction") {
      el.removeAttribute(attr.name);
      continue;
    }
    if (name === "style") {
      el.setAttribute("style", sanitizeCss(attr.value));
      continue;
    }
    if (ALLOWED_URI_ATTRS.has(name) && !isSafeUrl(attr.value, name)) {
      el.removeAttribute(attr.name);
    }
  }
}

function walkAndSanitize(root: ParentNode, allowRemoteImages: boolean) {
  const nodes = [...root.querySelectorAll("*")];
  for (const el of nodes) {
    const tag = el.tagName.toLowerCase();
    if (BLOCKED_TAGS.has(tag)) {
      el.remove();
      continue;
    }
    if (tag === "style") {
      el.textContent = sanitizeCss(el.textContent ?? "");
      continue;
    }
    if (tag === "a") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
    stripEventHandlers(el);
    if (
      tag === "img" &&
      !allowRemoteImages &&
      /^https?:/i.test(el.getAttribute("src")?.trim() ?? "")
    ) {
      el.removeAttribute("src");
      el.setAttribute("data-remote-image-blocked", "true");
    }
  }
}

/**
 * Some providers send malformed templates where a style block is left open.
 * In that case browsers may move the CSS into the body as a plain text node.
 * Only remove a CSS-looking leading text node; normal message text is left
 * untouched.
 */
function looksLikeCssLeak(value: string): boolean {
  const text = value.trim();
  if (text.length < 24 || !/[{}]/.test(text)) return false;

  const signals = [
    /!important\b/i,
    /@(?:media|supports|font-face|import)\b/i,
    /(?:^|[\s.#[,])(?:body|html|table|td|img|wrapper|container)\b/i,
    /(?:color|display|padding|margin|font(?:-[\w-]+)?|background(?:-[\w-]+)?)\s*:/i,
  ];
  return signals.filter((pattern) => pattern.test(text)).length >= 2;
}

function stripLeadingCssTextNodes(root: Element): void {
  for (const node of [...root.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (looksLikeCssLeak(node.textContent ?? "")) node.remove();
      continue;
    }
    if (node.nodeType === Node.COMMENT_NODE) continue;
    // Once real markup starts, do not inspect message content further.
    break;
  }
}

function extractRawStyleBlocks(raw: string): { html: string; styles: string } {
  let styles = "";
  let html = raw.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_, css: string) => {
    styles += `\n${css}`;
    return "";
  });

  // Handle an unclosed style tag without swallowing the actual body markup.
  html = html.replace(
    /<style\b[^>]*>([\s\S]*?)(?=<\/?(?:head|body|html)\b|$)/gi,
    (_, css: string) => {
      styles += `\n${css}`;
      return "";
    },
  );

  return { html, styles };
}

function extractParts(
  raw: string,
  allowRemoteImages: boolean,
): { styles: string; body: string } {
  const extracted = extractRawStyleBlocks(raw);
  const parser = new DOMParser();
  const looksFull = /<html[\s>]|<body[\s>]/i.test(extracted.html);
  const doc = parser.parseFromString(
    looksFull ? extracted.html : `<div id="rukny-mail-root">${extracted.html}</div>`,
    "text/html",
  );

  const parsedStyles = [...doc.querySelectorAll("style")]
    .map((node) => node.textContent ?? "")
    .join("\n");

  for (const node of doc.querySelectorAll("style, script, link, meta, base")) {
    node.remove();
  }

  const bodySource = doc.body ?? doc;
  walkAndSanitize(bodySource, allowRemoteImages);

  const root = doc.getElementById("rukny-mail-root");
  stripLeadingCssTextNodes(root ?? bodySource);
  const body = (root ?? bodySource).innerHTML;
  return { styles: sanitizeCss(`${extracted.styles}\n${parsedStyles}`), body };
}

const MAIL_CLIENT_BASE_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
  }
  body {
    color: #172026;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }
  img { max-width: 100%; height: auto; }
  img[data-remote-image-blocked="true"] { display: none !important; }
  table { max-width: 100%; }
  pre { max-width: 100%; overflow-wrap: break-word; white-space: pre-wrap; }
`;

/** Isolated HTML document so message CSS cannot leak into the Mail app chrome. */
export function buildSandboxedMailDocument(
  rawHtml: string,
  options: { allowRemoteImages?: boolean } = {},
): string {
  const allowRemoteImages = options.allowRemoteImages !== false;
  const { styles, body } = extractParts(rawHtml, allowRemoteImages);
  const imageSources = allowRemoteImages
    ? "img-src data: blob: cid: https: http:;"
    : "img-src data: blob: cid:;";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; ${imageSources} style-src 'unsafe-inline'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';">
<base target="_blank">
<style>${MAIL_CLIENT_BASE_CSS}</style>
${styles.trim() ? `<style>${styles}</style>` : ""}
</head>
<body>${body}</body>
</html>`;
}

/**
 * Keep the sender layout intact. If it is wider than the pane, scale the
 * whole document down (typical 600px templates on a phone).
 */
export function adaptSandboxedMailToWidth(
  doc: Document,
  frameWidth: number,
): { height: number } {
  const html = doc.documentElement;
  const body = doc.body;
  if (!body || frameWidth < 32) {
    return { height: 120 };
  }

  body.style.transform = "none";
  body.style.width = "";
  html.style.overflow = "visible";

  const contentWidth = Math.max(body.scrollWidth, html.scrollWidth, 1);
  const contentHeight = Math.max(body.scrollHeight, html.scrollHeight, 120);

  if (contentWidth > frameWidth + 1) {
    const scale = frameWidth / contentWidth;
    body.style.transformOrigin = "top left";
    body.style.transform = `scale(${scale})`;
    body.style.width = `${contentWidth}px`;
    html.style.overflow = "hidden";
    return { height: Math.ceil(contentHeight * scale) };
  }

  html.style.overflow = "hidden";
  return { height: contentHeight };
}

export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value) || /<style[\s>]/i.test(value);
}
