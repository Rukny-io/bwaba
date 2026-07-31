'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const DESKTOP_NOTIFICATIONS_INTENT_KEY = 'forms:open-desktop-notifications';

export function markDesktopNotificationsIntent() {
  try {
    sessionStorage.setItem(DESKTOP_NOTIFICATIONS_INTENT_KEY, '1');
  } catch {
    // ignore
  }
}

function consumeDesktopNotificationsIntent(): boolean {
  try {
    if (sessionStorage.getItem(DESKTOP_NOTIFICATIONS_INTENT_KEY) !== '1') {
      return false;
    }
    sessionStorage.removeItem(DESKTOP_NOTIFICATIONS_INTENT_KEY);
    return true;
  } catch {
    return false;
  }
}

interface FormsDashboardContextValue {
  desktopNotificationsOpen: boolean;
  mobileNotificationsOpen: boolean;
  notificationsActive: boolean;
  toggleDesktopNotifications: () => void;
  openDesktopNotifications: () => void;
  closeNotifications: () => void;
  toggleMobileNotifications: () => void;
  closeMobileNotifications: () => void;
  setMobileNotificationsOpen: (open: boolean) => void;
}

const FormsDashboardContext = createContext<FormsDashboardContextValue | null>(
  null,
);

export function FormsDashboardProvider({ children }: { children: ReactNode }) {
  const [desktopNotificationsOpen, setDesktopNotificationsOpen] =
    useState(false);
  const [mobileNotificationsOpen, setMobileNotificationsOpen] =
    useState(false);

  useEffect(() => {
    if (consumeDesktopNotificationsIntent()) {
      setDesktopNotificationsOpen(true);
    }
  }, []);

  const closeNotifications = useCallback(() => {
    setDesktopNotificationsOpen(false);
  }, []);

  const closeMobileNotifications = useCallback(() => {
    setMobileNotificationsOpen(false);
  }, []);

  const toggleDesktopNotifications = useCallback(() => {
    setMobileNotificationsOpen(false);
    setDesktopNotificationsOpen((open) => !open);
  }, []);

  const openDesktopNotifications = useCallback(() => {
    setMobileNotificationsOpen(false);
    setDesktopNotificationsOpen(true);
  }, []);

  const toggleMobileNotifications = useCallback(() => {
    setDesktopNotificationsOpen(false);
    setMobileNotificationsOpen((open) => !open);
  }, []);

  return (
    <FormsDashboardContext.Provider
      value={{
        desktopNotificationsOpen,
        mobileNotificationsOpen,
        notificationsActive:
          desktopNotificationsOpen || mobileNotificationsOpen,
        toggleDesktopNotifications,
        openDesktopNotifications,
        closeNotifications,
        toggleMobileNotifications,
        closeMobileNotifications,
        setMobileNotificationsOpen,
      }}
    >
      {children}
    </FormsDashboardContext.Provider>
  );
}

export function useOptionalFormsDashboard() {
  return useContext(FormsDashboardContext);
}

export function useFormsDashboard() {
  const ctx = useOptionalFormsDashboard();
  if (!ctx) {
    throw new Error(
      'useFormsDashboard must be used within FormsDashboardProvider',
    );
  }
  return ctx;
}
