export const HQ_THEME_STORAGE_KEY = 'rukny-hq-theme';

export type HqTheme = 'dark' | 'light';

export function applyHqTheme(theme: HqTheme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  localStorage.setItem(HQ_THEME_STORAGE_KEY, theme);
}

export function readHqTheme(): HqTheme {
  const stored = localStorage.getItem(HQ_THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
