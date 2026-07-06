'use client';

import { EmptyState, Table } from '@heroui/react';
import type { AdminUser } from '@/lib/types/users';
import { UsersTableRow } from '@/components/users/users-table-row';
import { ClientPagination } from '@/components/shared/client-pagination';

const COLUMNS = [
  { id: 'user', label: 'User', isRowHeader: true },
  { id: 'role', label: 'Role' },
  { id: 'plan', label: 'Plan' },
  { id: 'status', label: 'Status' },
  { id: 'lastSeen', label: 'Last seen' },
  { id: 'actions', label: 'Actions', className: 'text-end' },
] as const;

interface UsersTableProps {
  users: AdminUser[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

function UsersTableHeader() {
  return (
    <Table.Header>
      {COLUMNS.map((column) => (
        <Table.Column
          key={column.id}
          id={column.id}
          isRowHeader={'isRowHeader' in column ? column.isRowHeader : false}
          className={'className' in column ? column.className : undefined}
        >
          {column.label}
        </Table.Column>
      ))}
    </Table.Header>
  );
}

function UsersTableLoadingBody() {
  return (
    <Table.Body>
      {Array.from({ length: 6 }).map((_, index) => (
        <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
          {COLUMNS.map((column) => (
            <Table.Cell key={column.id}>
              <div className="h-4 animate-pulse rounded-md bg-[var(--surface-secondary)]" />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function UsersTable({
  users,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  onRefresh,
}: UsersTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Platform users">
          <UsersTableHeader />

          {isLoading ? (
            <UsersTableLoadingBody />
          ) : (
            <Table.Body
              items={users}
              renderEmptyState={() => (
                <EmptyState className="py-10">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    No users found
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Try a different search term or filter.
                  </p>
                </EmptyState>
              )}
            >
              {(user) => <UsersTableRow user={user} onRefresh={onRefresh} />}
            </Table.Body>
          )}
        </Table.Content>
      </Table.ScrollContainer>

      {!isLoading ? (
        <Table.Footer>
          <ClientPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </Table.Footer>
      ) : null}
    </Table>
  );
}
