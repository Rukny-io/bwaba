'use client';

import { Modal } from '@heroui/react';
import { EditCollectionForm } from '@/components/products/collections/edit-collection-form';
import type { ProductCollection } from '@/lib/collections/types';

interface EditCollectionDialogProps {
  collection: ProductCollection | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: EditCollectionDialogProps) {
  function handleUpdated() {
    onUpdated?.();
    onClose();
  }

  function handleDeleted() {
    onDeleted?.();
    onClose();
  }

  return (
    <Modal.Backdrop
      isOpen={open && Boolean(collection)}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      isDismissable
      variant="blur"
    >
      <Modal.Container placement="center" className="px-2 sm:px-3">
        <Modal.Dialog
          dir="rtl"
          lang="ar"
          aria-labelledby="edit-collection-title"
          className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--surface)] p-0 !shadow-none ring-0 outline-none"
        >
          {collection ? (
            <EditCollectionForm
              key={collection.id}
              collection={collection}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onCancel={onClose}
            />
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
