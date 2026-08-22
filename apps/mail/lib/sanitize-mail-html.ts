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

/** Isolated HTML document so message CSS cannot leak into the Mail app chrome. */
export function buildSandboxedMailDocument(rawHtml: string): string {
  const { styles, body } = extractParts(rawHtml);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';">
<base target="_blank">
<style>
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
</style>
${styles.trim() ? `<style>${styles}</style>` : ""}
</head>
<body>${body}</body>
</html>`;
}

export function looksLikeHtml(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value) || /<style[\s>]/i.test(value);
}
