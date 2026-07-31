'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEVELOPER_PRODUCTS,
  getDeveloperProduct,
  type DeveloperProduct,
  type DeveloperProductId,
} from '@/lib/developer-products';
import {
  installProduct,
  listInstalledProducts,
  type InstalledProduct,
} from '@/lib/api/products';

const LEGACY_STORAGE_KEY = (appId: string) =>
  `rukny-dev-sidebar-products:${appId}`;

export const installedProductsKeys = {
  all: (appId: string) => ['installed-products', appId] as const,
};

function readLegacyPinned(appId: string): DeveloperProductId[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY(appId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set<string>(DEVELOPER_PRODUCTS.map((p) => p.id));
    return parsed.filter(
      (id): id is DeveloperProductId => typeof id === 'string' && valid.has(id),
    );
  } catch {
    return [];
  }
}

function clearLegacyPinned(appId: string) {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY(appId));
  } catch {
    /* ignore */
  }
}

interface InstalledProductsContextValue {
  appId: string;
  installedIds: DeveloperProductId[];
  installedProducts: DeveloperProduct[];
  hydrated: boolean;
  isLoading: boolean;
  isInstalling: boolean;
  isInstalled: (productId: string) => boolean;
  install: (productId: DeveloperProductId) => Promise<void>;
}

const InstalledProductsContext =
  createContext<InstalledProductsContextValue | null>(null);

export function SidebarProductsProvider({
  appId,
  children,
}: {
  appId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const migratedRef = useRef(false);

  const { data, isLoading, isFetched } = useQuery({
    queryKey: installedProductsKeys.all(appId),
    queryFn: () => listInstalledProducts(appId),
    enabled: Boolean(appId),
    staleTime: 30_000,
  });

  const installedRows = data ?? [];

  useEffect(() => {
    if (!isFetched || migratedRef.current) return;
    migratedRef.current = true;

    const legacy = readLegacyPinned(appId);
    if (legacy.length === 0) return;

    const serverIds = new Set(installedRows.map((row) => row.productId));
    const pending = legacy.filter((id) => !serverIds.has(id));
    if (pending.length === 0) {
      clearLegacyPinned(appId);
      return;
    }

    void (async () => {
      for (const productId of pending) {
        try {
          await installProduct(appId, productId);
        } catch {
          /* keep legacy entry if migration fails */
        }
      }
      clearLegacyPinned(appId);
      await queryClient.invalidateQueries({
        queryKey: installedProductsKeys.all(appId),
      });
    })();
  }, [appId, installedRows, isFetched, queryClient]);

  const installMutation = useMutation({
    mutationFn: (productId: DeveloperProductId) =>
      installProduct(appId, productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({
        queryKey: installedProductsKeys.all(appId),
      });
      const previous = queryClient.getQueryData<InstalledProduct[]>(
        installedProductsKeys.all(appId),
      );
      const optimistic: InstalledProduct = {
        productId,
        installedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InstalledProduct[]>(
        installedProductsKeys.all(appId),
        (old) => {
          const list = old ?? [];
          if (list.some((row) => row.productId === productId)) return list;
          return [...list, optimistic];
        },
      );
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          installedProductsKeys.all(appId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: installedProductsKeys.all(appId),
      });
    },
  });

  const installedIds = useMemo(
    () => installedRows.map((row) => row.productId),
    [installedRows],
  );

  const installedProducts = useMemo(
    () =>
      installedIds
        .map((id) => getDeveloperProduct(id))
        .filter((p): p is DeveloperProduct => Boolean(p)),
    [installedIds],
  );

  const isInstalled = useCallback(
    (productId: string) =>
      installedIds.includes(productId as DeveloperProductId),
    [installedIds],
  );

  const install = useCallback(
    async (productId: DeveloperProductId) => {
      const product = getDeveloperProduct(productId);
      if (!product || product.status !== 'available') return;
      if (isInstalled(productId)) return;
      await installMutation.mutateAsync(productId);
    },
    [installMutation, isInstalled],
  );

  const value = useMemo(
    () => ({
      appId,
      installedIds,
      installedProducts,
      hydrated: isFetched,
      isLoading,
      isInstalling: installMutation.isPending,
      isInstalled,
      install,
    }),
    [
      appId,
      installedIds,
      installedProducts,
      isFetched,
      isLoading,
      installMutation.isPending,
      isInstalled,
      install,
    ],
  );

  return (
    <InstalledProductsContext.Provider value={value}>
      {children}
    </InstalledProductsContext.Provider>
  );
}

export function useSidebarProducts() {
  const ctx = useContext(InstalledProductsContext);
  if (!ctx) {
    throw new Error(
      'useSidebarProducts must be used within SidebarProductsProvider',
    );
  }
  return ctx;
}

export function useSidebarProductsOptional() {
  return useContext(InstalledProductsContext);
}
