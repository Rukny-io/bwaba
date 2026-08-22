"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type MailNavPendingContextValue = {
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
};

const MailNavPendingContext = createContext<MailNavPendingContextValue>({
  pendingHref: null,
  setPendingHref: () => {},
});

export function MailNavPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const value = useMemo(
    () => ({ pendingHref, setPendingHref }),
    [pendingHref],
  );

  return (
    <MailNavPendingContext.Provider value={value}>
      {children}
    </MailNavPendingContext.Provider>
  );
}

export function useMailNavPending() {
  return useContext(MailNavPendingContext);
}
