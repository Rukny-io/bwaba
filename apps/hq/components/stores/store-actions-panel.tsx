'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Power, Trash2 } from 'lucide-react';
import { Button, Chip } from '@heroui/react';
import type { AdminStoreDetail, StoreStatus } from '@/lib/types/stores';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import {
  formatStoreStatus,
  storeStatusChipColor,
  storeStatusHint,
} from '@/lib/stores-format';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { detailPanelClassName } from '@/components/ui/pill-tab';

interface StoreActionsPanelProps {
  store: AdminStoreDetail;
  onStoreUpdated: () => void;
}

export function StoreActionsPanel({ store, onStoreUpdated }: StoreActionsPanelProps) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const nextStatus: StoreStatus = store.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

  async function handleStatusChange() {
    setStatusLoading(true);
    try {
      await hqApi.updateStoreStatus(store.id, nextStatus);
      appToast.success(
        nextStatus === 'ACTIVE' ? 'Store activated' : 'Store deactivated',
      );
      onStoreUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not update store status',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await hqApi.deleteStore(store.id);
      appToast.success('Store deleted');
      router.replace('/app/stores');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not delete store',
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Status</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Chip color={storeStatusChipColor(store.status)} size="sm" variant="soft">
                {formatStoreStatus(store.status)}
              </Chip>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {storeStatusHint(store.status)}
              </p>
            </div>
            <Button
              variant="tertiary"
              size="sm"
              className="rounded-xl"
              isDisabled={statusLoading}
              onPress={() => setConfirmStatus(true)}
            >
              {statusLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              {nextStatus === 'ACTIVE' ? 'Activate store' : 'Deactivate store'}
            </Button>
          </div>
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Danger zone</h2>
        <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4">
          <p className="text-sm text-[var(--foreground)]">Delete store permanently</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            This removes the store and all related data. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-4 rounded-xl"
            isDisabled={deleteLoading}
            onPress={() => setConfirmDelete(true)}
          >
            {deleteLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete store
          </Button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmStatus}
        onOpenChange={setConfirmStatus}
        title={nextStatus === 'ACTIVE' ? 'Activate store?' : 'Deactivate store?'}
        description={
          nextStatus === 'ACTIVE'
            ? `Activate "${store.name}"? It will become visible to customers.`
            : `Deactivate "${store.name}"? It will be hidden from customers.`
        }
        confirmLabel={nextStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'}
        isLoading={statusLoading}
        onConfirm={handleStatusChange}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete store?"
        description={`Permanently delete "${store.name}" and all its products, orders, and coupons? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
