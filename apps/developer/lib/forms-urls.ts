const PUBLIC_SITE_BASE =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://rukny.io';

const FORMS_DASHBOARD_BASE =
  process.env.NEXT_PUBLIC_FORMS_URL?.replace(/\/$/, '') ||
  'https://forms.rukny.io';

export function getFormsDashboardUrl(path = '/app'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${FORMS_DASHBOARD_BASE}${normalized}`;
}

export function getFormsCreateUrl(appId?: string): string {
  const base = getFormsDashboardUrl('/forms/n/new');
  if (!appId) return base;
  const params = new URLSearchParams({ from: 'developer', appId });
  return `${base}?${params.toString()}`;
}

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
  // Optional: validate event.origin against your allowed Rukny domain
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
