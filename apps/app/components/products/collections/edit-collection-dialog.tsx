'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EditCollectionForm } from '@/components/products/collections/edit-collection-form';
import type { ProductCollection } from '@/lib/collections/types';
import { cn } from '@/lib/utils';

const DIALOG_SHELL_CLASS =
  'flex max-h-[90vh] w-full max-w-[32rem] flex-col overflow-hidden rounded-2xl border border-[rgba(34,34,34,0.1)] bg-white shadow-[0px_8px_12px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0px_8px_12px_rgba(0,0,0,0.35)]';

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
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!open || !collection) return;
    setFormKey((key) => key + 1);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [collection, open]);

  function handleUpdated() {
    onUpdated?.();
    onClose();
  }

  function handleDeleted() {
    onDeleted?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && collection ? (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="fixed inset-0 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 8 }}
            transition={{ type: 'spring', damping: 34, stiffness: 380, mass: 0.9 }}
            onClick={onClose}
          >
            <div
              className={cn('relative', DIALOG_SHELL_CLASS)}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-collection-title"
              dir="rtl"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(34,34,34,0.08)] px-4 py-3.5 dark:border-white/10">
                <h2
                  id="edit-collection-title"
                  className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
                >
                  تعديل المجموعة
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-black/[0.04] hover:text-[var(--foreground)] dark:hover:bg-white/10"
                  aria-label="إغلاق"
                >
                  <X className="size-4" />
                </button>
              </div>

              <EditCollectionForm
                key={`${collection.id}-${formKey}`}
                collection={collection}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
