'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import {
  ArrowRight,
  Inbox,
  Instagram,
  Trash2,
  Users,
} from 'lucide-react';
import {
  disconnectInstagram,
  fetchInstagramConnection,
  inboxPathForAccount,
  type InstagramConnection,
} from '@/lib/instagram';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { appToast } from '@/lib/app-toast';
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

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)]/80 px-4 py-3">
      <p className="text-[11px] font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-[var(--foreground)]" dir="ltr">
        {value}
      </p>
    </div>
  );
}

export function InstagramAccountDetailPanel({
  connectionId,
}: {
  connectionId: string;
}) {
  const router = useRouter();
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInstagramConnection(connectionId);
      setConnection(data);
    } catch (error) {
      appToast.fromError(error, 'تعذر تحميل الحساب');
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectInstagram(connectionId);
      appToast.success('تم فصل حساب Instagram');
      router.push('/app/instagram');
      router.refresh();
    } catch (error) {
      appToast.fromError(error, 'تعذر فصل الحساب');
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <PanelShell className="py-16 text-center">
        <p className="text-[13px] text-[var(--muted-foreground)]">جارٍ تحميل الحساب…</p>
      </PanelShell>
    );
  }

  if (!connection) {
    return (
      <section className="dashboard-section-stack">
        <DashboardPageHeader title="Instagram" description="الحساب غير موجود أو تم فصله." />
        <PanelShell className="py-12 text-center">
          <p className="text-[13px] text-[var(--muted-foreground)]">
            لم نجد هذا الحساب. ربما تم فصله أو الرابط غير صحيح.
          </p>
          <Link
            href="/app/instagram"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            العودة إلى Instagram
          </Link>
        </PanelShell>
      </section>
    );
  }

  const tokenExpiryLabel = connection.tokenExpiry
    ? new Date(connection.tokenExpiry).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <section className="dashboard-section-stack">
      <DashboardPageHeader
        title={connection.name || connection.username}
        description={
          <>
            <span dir="ltr">@{connection.username}</span>
            {' · '}
            حساب Instagram Professional مربوط
          </>
        }
        actions={
          <Link
            href="/app/instagram"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            <ArrowRight className="size-3.5" aria-hidden />
            كل الحسابات
          </Link>
        }
      />

      <PanelShell>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative mx-auto size-20 shrink-0 overflow-hidden rounded-[1.25rem] bg-[var(--surface-secondary)] sm:mx-0">
            {connection.profilePicUrl ? (
              <Image
                src={connection.profilePicUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center text-2xl font-semibold text-[#bc1888]">
                {(connection.username || '?').slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-start">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#bc1888]/10 px-2.5 py-1 text-[11px] font-semibold text-[#bc1888]">
              <Instagram className="size-3.5" aria-hidden />
              Instagram
            </div>
            {connection.biography ? (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                {connection.biography}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatItem
            label="المتابعون"
            value={connection.followersCount?.toLocaleString('en-US') ?? '—'}
          />
          <StatItem
            label="المنشورات"
            value={String(connection.mediaCount ?? '—')}
          />
          <StatItem label="انتهاء التوكن" value={tokenExpiryLabel} />
          <StatItem label="الحالة" value="متصل" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={inboxPathForAccount(connection.id)}
            className="inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-4 py-2 text-[13px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            <Inbox className="size-4" />
            <span className="ms-2">فتح صندوق الوارد</span>
          </Link>
          <Button
            variant="secondary"
            className="rounded-full"
            isPending={disconnecting}
            onPress={() => void handleDisconnect()}
          >
            <Trash2 className="size-4" />
            <span className="ms-2">فصل الحساب</span>
          </Button>
        </div>
      </PanelShell>

      <PanelShell>
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
          <div>
            <p className="text-[13px] font-semibold text-[var(--foreground)]">المحادثات</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
              رسائل DM لهذا الحساب ستظهر في صندوق الوارد. الرد المباشر من هذه الصفحة قريباً.
            </p>
            <Link
              href={inboxPathForAccount(connection.id)}
              className="mt-3 inline-flex text-[12px] font-semibold text-[var(--primary)] hover:underline"
            >
              الانتقال إلى صندوق الوارد
            </Link>
          </div>
        </div>
      </PanelShell>
    </section>
  );
}
