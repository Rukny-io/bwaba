const PUBLIC_SITE_BASE =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://rukny.io';

const DEVELOPERS_BASE =
  process.env.NEXT_PUBLIC_DEVELOPERS_URL?.replace(/\/$/, '') ||
  'https://developers.rukny.io';

export function getPublicFormUrl(slug: string, embed = false): string {
  const url = `${PUBLIC_SITE_BASE}/f/${encodeURIComponent(slug)}`;
  return embed ? `${url}?embed=1` : url;
}

export function buildIframeEmbedCode(slug: string, height = 640): string {
  const src = getPublicFormUrl(slug, true);
  return `<iframe
  src="${src}"
  width="100%"
  height="${height}"
  style="border:0;border-radius:12px;"
  loading="lazy"
  title="Rukny Form"
  allow="clipboard-write"
></iframe>`;
}

export function buildEmbedListenerSnippet(): string {
  return `window.addEventListener('message', (event) => {
  if (event.data?.type !== 'rukny:form') return;
  if (event.data.event === 'submitted') {
    console.log('Form submitted:', event.data.slug);
  }
  if (event.data.event === 'resize' && typeof event.data.height === 'number') {
    const iframe = document.querySelector('iframe[data-rukny-form]');
    if (iframe instanceof HTMLIFrameElement) {
      iframe.style.height = event.data.height + 'px';
    }
  }
});`;
}

export function getDeveloperAppFormsUrl(publicAppId: string): string {
  return `${DEVELOPERS_BASE}/apps/${encodeURIComponent(publicAppId)}/forms`;
}

export function getDeveloperFormConnectUrl(
  publicAppId: string,
  formId: string,
): string {
  return `${DEVELOPERS_BASE}/apps/${encodeURIComponent(publicAppId)}/forms/${encodeURIComponent(formId)}/connect`;
}

export function getDeveloperAppDomainsUrl(publicAppId: string): string {
  return `${DEVELOPERS_BASE}/apps/${encodeURIComponent(publicAppId)}/settings/domains`;
}
