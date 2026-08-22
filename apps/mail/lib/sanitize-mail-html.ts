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

function walkAndSanitize(root: ParentNode) {
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
  }
}

function extractParts(raw: string): { styles: string; body: string } {
  const parser = new DOMParser();
  const looksFull = /<html[\s>]|<body[\s>]/i.test(raw);
  const doc = parser.parseFromString(
    looksFull ? raw : `<div id="rukny-mail-root">${raw}</div>`,
    "text/html",
  );

  const styles = [...doc.querySelectorAll("style")]
    .map((node) => node.textContent ?? "")
    .join("\n");

  for (const node of doc.querySelectorAll("style, script, link, meta, base")) {
    node.remove();
  }

  const bodySource = doc.body ?? doc;
  walkAndSanitize(bodySource);

  const root = doc.getElementById("rukny-mail-root");
  const body = (root ?? bodySource).innerHTML;
  return { styles: sanitizeCss(styles), body };
}

const MAIL_CLIENT_BASE_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: system-ui, -apple-system, Segoe UI, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    word-break: break-word;
  }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; border-collapse: collapse; }
  a { color: #2563eb; }
`;

/** Applied last so typical 600px marketing tables can still shrink on phones. */
const MAIL_CLIENT_OVERRIDE_CSS = `
  html {
    overflow-x: hidden !important;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    color-scheme: light;
  }
  html, body {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    margin: 0 !important;
    box-sizing: border-box !important;
  }
  body { padding: 0 !important; }
  *, *::before, *::after { box-sizing: border-box; }
  img, picture, video {
    max-width: 100% !important;
    height: auto !important;
  }
  pre, code, a {
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  @media screen and (max-width: 680px) {
    table { max-width: 100% !important; }
    td, th { height: auto !important; }
  }
`;

/** Isolated HTML document so message CSS cannot leak into the Mail app chrome. */
export function buildSandboxedMailDocument(rawHtml: string): string {
  const { styles, body } = extractParts(rawHtml);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';">
<base target="_blank">
<style>${MAIL_CLIENT_BASE_CSS}</style>
${styles.trim() ? `<style>${styles}</style>` : ""}
<style>${MAIL_CLIENT_OVERRIDE_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

function cssPx(value: string): number | null {
  if (!value || value.includes("%") || value.includes("em")) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Loosen fixed-width email tables for the current pane, then scale if the
 * layout is still wider than the iframe (common 600px templates on phones).
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

  body.style.transform = "";
  body.style.width = "";
  html.style.overflowX = "hidden";

  for (const img of body.querySelectorAll("img")) {
    img.style.maxWidth = "100%";
    img.style.height = "auto";
  }

  for (const el of body.querySelectorAll<HTMLElement>("table, td, th, div, center")) {
    const widthAttr = el.getAttribute("width");
    if (widthAttr && !widthAttr.includes("%")) {
      const n = Number.parseInt(widthAttr, 10);
      if (Number.isFinite(n) && n > frameWidth) {
        el.setAttribute("width", "100%");
      }
    }
    const minPx = cssPx(el.style.minWidth);
    if (minPx != null && minPx > frameWidth) {
      el.style.minWidth = "0px";
    }
    const widthPx = cssPx(el.style.width);
    if (widthPx != null && widthPx > frameWidth) {
      el.style.width = "100%";
      el.style.maxWidth = "100%";
    }
  }

  const contentWidth = Math.max(body.scrollWidth, html.scrollWidth);
  let height = Math.max(body.scrollHeight, html.scrollHeight, 120);

  if (contentWidth > frameWidth + 2) {
    const scale = frameWidth / contentWidth;
    body.style.transformOrigin = "top left";
    body.style.transform = `scale(${scale})`;
    body.style.width = `${contentWidth}px`;
    height = Math.ceil(height * scale);
  }

  return { height };
}

export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value) || /<style[\s>]/i.test(value);
}
