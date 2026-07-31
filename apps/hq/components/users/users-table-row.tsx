'use client';

import { useRouter } from 'next/navigation';
import { Button, Chip, Table } from '@heroui/react';
import type { AdminUser } from '@/lib/types/users';
import { UsersTableUserCell } from '@/components/users/users-table-user-cell';
import { UsersRowActions } from '@/components/users/users-row-actions';
import {
  accountStatusChipColor,
  displayUserName,
  formatLastSeen,
  formatRole,
  roleChipColor,
} from '@/lib/users-format';
import { cn } from '@/lib/utils';

interface UsersTableRowProps {
  user: AdminUser;
  onRefresh: () => void;
}

export function UsersTableRow({ user, onRefresh }: UsersTableRowProps) {
  const router = useRouter();
  const displayName = displayUserName(user.name, user.email);

  return (
    <Table.Row
      id={user.id}
      textValue={displayName}
      className={cn(user.isDeactivated && 'opacity-70')}
    >
      <Table.Cell>
        <UsersTableUserCell user={user} />
      </Table.Cell>
      <Table.Cell>
        <Chip color={roleChipColor(user.role)} size="sm" variant="soft">
          {formatRole(user.role)}
        </Chip>
      </Table.Cell>
      <Table.Cell className="text-sm text-[var(--foreground)]">
        {user.subscriptionPlan || 'FREE'}
      </Table.Cell>
      <Table.Cell>
        <Chip
          color={accountStatusChipColor(user.isDeactivated)}
          size="sm"
          variant="soft"
        >
          {user.isDeactivated ? 'Deactivated' : 'Active'}
        </Chip>
      </Table.Cell>
      <Table.Cell className="text-sm text-[var(--muted-foreground)]">
        {formatLastSeen(user.lastLoginAt)}
      </Table.Cell>
      <Table.Cell className="text-end">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="tertiary"
            className="rounded-lg"
            onPress={() => router.push(`/app/users/${user.id}`)}
          >
            Details
          </Button>
          <UsersRowActions user={user} onRefresh={onRefresh} />
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
