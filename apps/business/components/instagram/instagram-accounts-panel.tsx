'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/react';
import { Instagram, Link2, Trash2, Users } from 'lucide-react';
import {
  disconnectInstagram,
  fetchInstagramConnections,
  instagramAccountPath,
  startInstagramOAuth,
  type InstagramConnection,
} from '@/lib/instagram';
import { appToast } from '@/lib/app-toast';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { cn } from '@/lib/utils';

function PanelShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[1.75rem] bg-[var(--surface)] p-4 sm:rounded-[2rem] sm:p-5',
        className,
      )}
    >
      {children}
    </section>
  );
}

function ConnectButton({
  pending,
  onPress,
  label = 'ربط حساب',
  compact = false,
}: {
  pending?: boolean;
  onPress: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <Button
      className={cn('rounded-full', compact && 'text-[13px]')}
      isPending={pending}
      onPress={onPress}
    >
      {compact ? <Instagram className="size-4" /> : <Link2 className="size-4" />}
      <span className="ms-2">{label}</span>
    </Button>
  );
}

function AccountCard({
  connection,
  disconnecting,
  onDisconnect,
}: {
  connection: InstagramConnection;
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  return (
    <PanelShell className="group transition-colors hover:bg-[var(--surface-secondary)]/30">
      <Link
        href={instagramAccountPath(connection.id)}
        className="block rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <div className="flex items-start gap-3.5">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
            {connection.profilePicUrl ? (
              <Image
                src={connection.profilePicUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center text-base font-semibold text-[#bc1888]">
                {(connection.username || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[var(--foreground)]">
              {connection.name || connection.username}
            </p>
            <p className="truncate text-[13px] text-[var(--muted-foreground)]" dir="ltr">
              @{connection.username}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden />
                <span dir="ltr">{connection.followersCount?.toLocaleString() ?? '—'}</span>
                <span>متابع</span>
              </span>
              <span>{connection.mediaCount ?? 0} منشور</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={disconnecting}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDisconnect();
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)] disabled:opacity-50"
        >
          <Trash2 className="size-3.5" aria-hidden />
          {disconnecting ? 'جاري الفصل…' : 'فصل الحساب'}
        </button>
      </div>
    </PanelShell>
  );
}

function EmptyAccounts({
  connecting,
  onConnect,
}: {
  connecting: boolean;
  onConnect: () => void;
}) {
  return (
    <PanelShell className="flex flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[#bc1888]">
        <Instagram className="size-5" strokeWidth={1.8} aria-hidden />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-[var(--foreground)]">
        لا توجد حسابات مربوطة
      </h2>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-[var(--muted-foreground)]">
        اربط حساب Instagram Professional لاستقبال الرسائل والتعليقات.
      </p>
      <div className="mt-5">
        <ConnectButton
          pending={connecting}
          onPress={onConnect}
          label="ربط Instagram"
          compact
        />
      </div>
    </PanelShell>
  );
}

function LoadingState() {
  return (
    <PanelShell className="py-12 text-center sm:py-16">
      <p className="text-[13px] text-[var(--muted-foreground)]">جارٍ تحميل الحسابات…</p>
    </PanelShell>
  );
}

export function InstagramAccountsPanel() {
  const [connections, setConnections] = useState<InstagramConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchInstagramConnections();
      setConnections(list);
    } catch (error) {
      appToast.fromError(error, 'تعذر تحميل حسابات Instagram');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  async function handleConnect() {
    setConnecting(true);
    try {
      await startInstagramOAuth('/app/instagram');
    } catch (error) {
      appToast.fromError(error, 'تعذر بدء ربط Instagram');
      setConnecting(false);
    }
  }

  async function handleDisconnect(connectionId: string) {
    setDisconnectingId(connectionId);
    try {
      await disconnectInstagram(connectionId);
      appToast.success('تم فصل حساب Instagram');
      await loadConnections();
    } catch (error) {
      appToast.fromError(error, 'تعذر فصل الحساب');
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <section className="dashboard-section-stack">
      <DashboardPageHeader
        title="Instagram"
        description="اربط حساب Instagram Professional لاستقبال رسائلك."
        actions={
          connections.length > 0 ? (
            <ConnectButton pending={connecting} onPress={() => void handleConnect()} />
          ) : null
        }
      />

      {loading ? (
        <LoadingState />
      ) : connections.length === 0 ? (
        <EmptyAccounts connecting={connecting} onConnect={() => void handleConnect()} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {connections.map((connection) => (
            <AccountCard
              key={connection.id}
              connection={connection}
              disconnecting={disconnectingId === connection.id}
              onDisconnect={() => void handleDisconnect(connection.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
