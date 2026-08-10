'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  ExternalLink,
  FileText,
  Loader2,
  Settings2,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminStoreDetail } from '@/lib/types/stores';
import { StoreOverviewPanel } from '@/components/stores/store-overview-panel';
import { StoreActivityPanel } from '@/components/stores/store-activity-panel';
import { StoreActionsPanel } from '@/components/stores/store-actions-panel';
import { getStorePublicUrl } from '@/lib/stores-url';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  formatStoreStatus,
  storeStatusChipColor,
} from '@/lib/stores-format';
import {
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';

type StoreDetailTab = 'overview' | 'activity' | 'actions';

const TAB_IDS: StoreDetailTab[] = ['overview', 'activity', 'actions'];

const TABS: { id: StoreDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'actions', label: 'Actions', icon: Settings2 },
];

function parseTabParam(value: string | null): StoreDetailTab {
  if (value && TAB_IDS.includes(value as StoreDetailTab)) {
    return value as StoreDetailTab;
  }
  return 'overview';
}

interface StoreDetailViewProps {
  storeId: string;
}

export function StoreDetailView({ storeId }: StoreDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<AdminStoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StoreDetailTab>(() =>
    parseTabParam(searchParams.get('tab')),
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const loadStore = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hqApi.getStore(storeId);
      setStore(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load store details',
      );
      router.replace('/app/stores');
    } finally {
      setLoading(false);
    }
  }, [storeId, router]);

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  function handleTabChange(tab: StoreDetailTab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  if (loading || !store) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const logoUrl = resolveMediaUrl(store.logo);
  const publicUrl = getStorePublicUrl(store.slug);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/app/stores"
            className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Stores
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Chip color={storeStatusChipColor(store.status)} size="sm" variant="soft">
              {formatStoreStatus(store.status)}
            </Chip>
            <Button
              size="sm"
              variant="tertiary"
              className="h-8 rounded-xl px-2.5"
              onPress={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="size-3.5" />
              View storefront
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={56}
                height={56}
                className="size-full object-cover"
                unoptimized
              />
            ) : (
              <Store className="size-6" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
              {store.name}
            </h1>
            <p className="mt-0.5 font-mono text-sm text-[var(--muted-foreground)]" dir="ltr">
              /{store.slug}
            </p>
          </div>
        </div>

        <div className={workspaceTabGroupClassName}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={workspaceTabClassName(activeTab === tab.id)}
            >
              <tab.icon className="size-3.5" aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'overview' ? <StoreOverviewPanel store={store} /> : null}
      {activeTab === 'activity' ? <StoreActivityPanel store={store} /> : null}
      {activeTab === 'actions' ? (
        <StoreActionsPanel store={store} onStoreUpdated={loadStore} />
      ) : null}
    </div>
  );
}
