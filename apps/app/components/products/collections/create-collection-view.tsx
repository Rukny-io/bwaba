'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateCollectionDialog } from '@/components/products/collections/create-collection-dialog';
import { COLLECTIONS_BASE_PATH } from '@/lib/collections/paths';

/** Opens the create dialog then returns to the collections list. */
export function CreateCollectionView() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      router.replace(COLLECTIONS_BASE_PATH);
    }
  }, [open, router]);

  return (
    <CreateCollectionDialog
      open={open}
      onClose={() => setOpen(false)}
      onCreated={() => setOpen(false)}
    />
  );
}
