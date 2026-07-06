'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';

interface FormsDashboardContextValue {
  desktopNotificationsOpen: boolean;
  mobileNotificationsOpen: boolean;
  notificationsActive: boolean;
  toggleDesktopNotifications: () => void;
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
