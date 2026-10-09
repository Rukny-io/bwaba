'use client';

import type { AdminUser } from '@/lib/types/users';
import { UsersCardsGrid } from '@/components/users/users-cards-grid';

interface UsersTableProps {
  users: AdminUser[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

/** Users list — card grid (replaces legacy table layout). */
export function UsersTable(props: UsersTableProps) {
  return <UsersCardsGrid {...props} />;
}
