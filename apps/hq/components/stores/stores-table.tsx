'use client';

import type { AdminStore } from '@/lib/types/stores';
import { StoresCardsGrid } from '@/components/stores/stores-cards-grid';

interface StoresTableProps {
  stores: AdminStore[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Stores list — card grid (replaces legacy table layout). */
export function StoresTable(props: StoresTableProps) {
  return <StoresCardsGrid {...props} />;
}
