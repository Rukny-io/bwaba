export type ProfilePageThemeKey = 'classic' | 'dark' | 'minimal';

export interface ProfilePageThemeOption {
  id: ProfilePageThemeKey;
  label: string;
  description: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  linkSurface: string;
}

export const PROFILE_PAGE_THEMES: ProfilePageThemeOption[] = [
  {
    id: 'classic',
    label: 'كلاسيكي',
    description: 'خلفية بيضاء وروابط واضحة',
    background: '#ffffff',
    foreground: '#0f172a',
    muted: '#64748b',
    accent: '#3b82f6',
    linkSurface: '#f1f5f9',
  },
  {
    id: 'dark',
    label: 'داكن',
    description: 'مريح للعين في الإضاءة المنخفضة',
    background: '#121212',
    foreground: '#f1f5f9',
    muted: '#94a3b8',
    accent: '#60a5fa',
    linkSurface: '#1e1e1e',
  },
  {
    id: 'minimal',
    label: 'بسيط',
    description: 'مساحات هادئة وتركيز على المحتوى',
    background: '#fafafa',
    foreground: '#171717',
    muted: '#737373',
    accent: '#2563eb',
    linkSurface: '#f0f0f0',
  },
];

export function resolveProfilePageTheme(themeKey?: string | null): ProfilePageThemeKey {
  if (themeKey === 'dark' || themeKey === 'minimal') return themeKey;
  return 'classic';
}
