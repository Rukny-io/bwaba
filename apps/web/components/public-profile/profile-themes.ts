export type ProfileThemeKey = 'classic' | 'dark' | 'minimal';

const PROFILE_THEME_BACKGROUNDS: Record<ProfileThemeKey, string> = {
  classic: '#ffffff',
  dark: '#121212',
  minimal: '#fafafa',
};

export function resolveProfileTheme(themeKey?: string | null): ProfileThemeKey {
  if (themeKey === 'dark' || themeKey === 'minimal') return themeKey;
  return 'classic';
}

export function getProfileThemeClass(themeKey?: string | null): string {
  return `profile-theme-${resolveProfileTheme(themeKey)}`;
}

/** Matches `.profile-theme-*` `--background` for html/body + theme-color. */
export function getProfileThemeBackground(themeKey?: string | null): string {
  return PROFILE_THEME_BACKGROUNDS[resolveProfileTheme(themeKey)];
}
