'use client';

import { EmptyState, Table } from '@heroui/react';
import type { AdminMailApp } from '@/lib/types/mail';
import { MailAppsTableRow } from '@/components/mail/mail-apps-table-row';
import { MailAppsMobileList } from '@/components/mail/mail-apps-mobile-list';
import { ClientPagination } from '@/components/shared/client-pagination';
import { cn } from '@/lib/utils';

const COLUMNS = [
  { id: 'app', label: 'App', isRowHeader: true, className: 'w-[16%]' },
  { id: 'owner', label: 'Owner', className: 'w-[16%]' },
  { id: 'domain', label: 'Domain', className: 'w-[12%]' },
  { id: 'domainStatus', label: 'Verification', className: 'w-[10%]' },
  { id: 'plan', label: 'Plan', className: 'w-[8%]' },
  { id: 'boxes', label: 'Boxes', className: 'w-[6%]' },
  { id: 'storage', label: 'Storage', className: 'w-[10%]' },
  { id: 'status', label: 'Status', className: 'w-[10%]' },
  { id: 'actions', label: '', className: 'w-[12%]' },
] as const;

interface MailAppsTableProps {
  apps: AdminMailApp[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function MailAppsTableHeader() {
  return (
    <Table.Header>
      {COLUMNS.map((column) => (
        <Table.Column
          key={column.id}
          id={column.id}
          isRowHeader={'isRowHeader' in column ? column.isRowHeader : false}
          className={cn(
            column.className,
            'text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]',
          )}
        >
          {column.label}
        </Table.Column>
      ))}
    </Table.Header>
  );
}

function MailAppsTableLoadingBody() {
  return (
    <Table.Body>
      {Array.from({ length: 6 }).map((_, index) => (
        <Table.Row key={`loading-${index}`} id={`loading-${index}`}>
          {COLUMNS.map((column) => (
            <Table.Cell key={column.id} className={column.className}>
              <div
                className={cn(
                  'animate-pulse rounded-md bg-[var(--surface-secondary)]',
                  column.id === 'app' || column.id === 'owner' ? 'h-8' : 'h-4',
                )}
              />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
}

export function MailAppsTable({
  apps,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: MailAppsTableProps) {
  return (
    <>
      <div className="sm:hidden">
        <MailAppsMobileList
          apps={apps}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>

      <div className="dashboard-card hidden overflow-hidden rounded-2xl sm:block">
        <Table className="p-4">
          <Table.ScrollContainer>
            <Table.Content aria-label="Mail apps" className="w-full table-fixed">
              <MailAppsTableHeader />
              {isLoading ? (
                <MailAppsTableLoadingBody />
              ) : (
                <Table.Body
                  items={apps}
                  renderEmptyState={() => (
                    <EmptyState className="py-12">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        No apps
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Try a different search or filter.
                      </p>
                    </EmptyState>
                  )}
                >
                  {(app) => <MailAppsTableRow app={app} />}
                </Table.Body>
              )}
            </Table.Content>
          </Table.ScrollContainer>
          {!isLoading ? (
            <Table.Footer className="border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/30 px-1">
              <ClientPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={onPageChange}
              />
            </Table.Footer>
          ) : null}
        </Table>
      </div>
    </>
  );
}
