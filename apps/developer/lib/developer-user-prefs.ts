export type ThemePreference = 'light' | 'dark' | 'system';
export type DefaultApiKeyEnvironment = 'test' | 'live';

export interface NotificationPreferences {
  quotaWarnings: boolean;
  lowBalance: boolean;
  billing: boolean;
  productUpdates: boolean;
}

export interface DeveloperUserPreferences {
  defaultApiKeyEnvironment: DefaultApiKeyEnvironment;
  notifications: NotificationPreferences;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  quotaWarnings: true,
  lowBalance: true,
  billing: true,
  productUpdates: false,
};

export const DEFAULT_DEVELOPER_PREFS: DeveloperUserPreferences = {
  defaultApiKeyEnvironment: 'test',
  notifications: DEFAULT_NOTIFICATION_PREFS,
};

const STORAGE_KEY = 'rukny-dev-user-prefs';

export function readDeveloperUserPrefs(): DeveloperUserPreferences {
  if (typeof window === 'undefined') return DEFAULT_DEVELOPER_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEVELOPER_PREFS;
    const parsed = JSON.parse(raw) as Partial<DeveloperUserPreferences>;
    return {
      defaultApiKeyEnvironment:
        parsed.defaultApiKeyEnvironment ??
        DEFAULT_DEVELOPER_PREFS.defaultApiKeyEnvironment,
      notifications: {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...parsed.notifications,
      },
    };
  } catch {
    return DEFAULT_DEVELOPER_PREFS;
  }
}

export function writeDeveloperUserPrefs(prefs: DeveloperUserPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(
    new CustomEvent('rukny-dev-user-prefs', { detail: prefs }),
  );
}
