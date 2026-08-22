'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { AdminMailApp } from '@/lib/types/mail';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { ClientPagination } from '@/components/shared/client-pagination';
import {
  formatMailAppStatus,
  formatMailDomainStatus,
  formatMailPlan,
  mailAppStatusChipColor,
  mailDomainStatusChipColor,
} from '@/lib/mail-format';

interface MailAppsMobileListProps {
  apps: AdminMailApp[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function MailAppsMobileList({
  apps,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: MailAppsMobileListProps) {
  if (isLoading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <li
            key={`mail-mobile-loading-${index}`}
            className="h-[7.5rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
          />
        ))}
      </ul>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No apps</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {apps.map((app) => (
          <li key={app.appId}>
            <div className="rounded-2xl bg-[var(--surface-secondary)]/55 p-3">
              <Link href={`/app/mail/${app.appId}`} className="block">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {app.name}
                </p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
                  {app.appId}
                </p>
              </Link>
              <div className="mt-3">
                <FormsTableOwnerCell owner={app.owner} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-medium">
                <Link href={`/app/mail/${app.appId}`} className="text-[var(--primary)]">
                  Details
                </Link>
                <Link
                  href={`/app/mail/${app.appId}?tab=analytics`}
                  className="text-[var(--primary)]"
                >
                  Analytics
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip color={mailAppStatusChipColor(app.status)} size="sm" variant="soft">
                  {formatMailAppStatus(app.status)}
                </Chip>
                <Chip
                  color={mailDomainStatusChipColor(app.domainStatus)}
                  size="sm"
                  variant="soft"
                >
                  {formatMailDomainStatus(app.domainStatus)}
                </Chip>
                <Chip size="sm" variant="soft">
                  {formatMailPlan(app.subscription?.plan)}
                </Chip>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ClientPagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}
