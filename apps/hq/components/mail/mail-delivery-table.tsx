'use client';

import Link from 'next/link';
import { Chip, EmptyState, Table } from '@heroui/react';
import type { MailDeliveryItem } from '@/lib/types/mail';
import { ClientPagination } from '@/components/shared/client-pagination';
import {
  formatMailDateTime,
  mailDeliveryStatusChipColor,
} from '@/lib/mail-format';

interface MailDeliveryTableProps {
  items: MailDeliveryItem[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function MailDeliveryTable({
  items,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: MailDeliveryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-card overflow-hidden rounded-2xl">
      <Table className="p-4">
        <Table.ScrollContainer>
          <Table.Content aria-label="Delivery log" className="w-full table-fixed">
            <Table.Header>
              <Table.Column id="when" isRowHeader className="w-[16%]">
                Time
              </Table.Column>
              <Table.Column id="dir" className="w-[8%]">
                Direction
              </Table.Column>
              <Table.Column id="from" className="w-[16%]">
                From
              </Table.Column>
              <Table.Column id="to" className="w-[16%]">
                To
              </Table.Column>
              <Table.Column id="subject" className="w-[18%]">
                Subject
              </Table.Column>
              <Table.Column id="status" className="w-[10%]">
                Status
              </Table.Column>
              <Table.Column id="app" className="w-[16%]">
                App
              </Table.Column>
            </Table.Header>
            <Table.Body
              items={items}
              renderEmptyState={() => (
                <EmptyState className="py-12">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    No failed or queued messages
                  </p>
                </EmptyState>
              )}
            >
              {(item) => (
                <Table.Row id={item.id} textValue={item.subject || item.id}>
                  <Table.Cell className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">
                    {formatMailDateTime(item.createdAt)}
                  </Table.Cell>
                  <Table.Cell className="text-xs">{item.direction}</Table.Cell>
                  <Table.Cell className="max-w-0 truncate text-xs" dir="ltr">
                    {item.fromAddress}
                  </Table.Cell>
                  <Table.Cell className="max-w-0 truncate text-xs" dir="ltr">
                    {item.toAddresses.join(', ') || '—'}
                  </Table.Cell>
                  <Table.Cell className="max-w-0 truncate text-xs">
                    <span className="block truncate">{item.subject || '(no subject)'}</span>
                    {item.errorMessage ? (
                      <span className="mt-0.5 block truncate text-[11px] text-[var(--danger)]">
                        {item.errorMessage}
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <Chip
                      color={mailDeliveryStatusChipColor(item.status)}
                      size="sm"
                      variant="soft"
                    >
                      {item.status}
                    </Chip>
                  </Table.Cell>
                  <Table.Cell className="text-xs">
                    {item.appId ? (
                      <div className="min-w-0">
                        <Link
                          href={`/app/mail/${item.appId}`}
                          className="block truncate text-[var(--foreground)] hover:text-[var(--primary)]"
                        >
                          {item.appName || item.appId}
                        </Link>
                        <Link
                          href={`/app/mail/${item.appId}?tab=analytics`}
                          className="text-[11px] font-medium text-[var(--primary)]"
                        >
                          Analytics
                        </Link>
                      </div>
                    ) : (
                      '—'
                    )}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer className="border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/30 px-1">
          <ClientPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </Table.Footer>
      </Table>
    </div>
  );
}
