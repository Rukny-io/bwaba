export type ProfileThemeKey = 'classic' | 'dark' | 'minimal';

export function resolveProfileTheme(themeKey?: string | null): ProfileThemeKey {
  if (themeKey === 'dark' || themeKey === 'minimal') return themeKey;
  return 'classic';
}

export function getProfileThemeClass(themeKey?: string | null): string {
  return `profile-theme-${resolveProfileTheme(themeKey)}`;
}
