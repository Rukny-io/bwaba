import { getUrlHostLabel } from '@/lib/links/build-link-from-type';

export function getDomainFromUrl(url: string): string {
  return getUrlHostLabel(url);
}

export function getClearbitLogoUrl(domain: string): string {
  const normalized = domain.replace(/^www\./, '').trim().toLowerCase();
  return `https://logo.clearbit.com/${encodeURIComponent(normalized)}`;
}

export function getDomainInitial(domain: string): string {
  const normalized = domain.replace(/^www\./, '').trim().toLowerCase();
  const segment = normalized.split('.')[0] ?? normalized;
  const initial = segment.replace(/[^a-z0-9]/gi, '').charAt(0);
  return (initial || '?').toUpperCase();
}

export function getDomainBrandColor(domain: string): string {
  const normalized = domain.replace(/^www\./, '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 52% 46%)`;
}
