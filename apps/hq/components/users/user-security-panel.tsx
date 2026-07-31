'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, LogOut, Send } from 'lucide-react';
import { Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminUserDetail, AdminUserSecurityLog } from '@/lib/types/users';
import type { UserLockoutStatus } from '@/lib/types/verification';
import {
  formatLastSeen,
  formatSecurityAction,
  formatUserDateTime,
} from '@/lib/users-format';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ClientPagination } from '@/components/shared/client-pagination';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const SECURITY_LOGS_PER_PAGE = 5;

interface UserSecurityPanelProps {
  user: AdminUserDetail;
  onUserUpdated: () => void;
}

function sessionLabel(session: AdminUserDetail['sessions'][number]): string {
  const parts = [session.deviceName, session.browser, session.os].filter(Boolean);
  return parts.join(' · ') || 'Unknown device';
}

function SecurityActivityLog({ logs }: { logs: AdminUserSecurityLog[] }) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [logs]);

  const totalPages = Math.max(1, Math.ceil(logs.length / SECURITY_LOGS_PER_PAGE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * SECURITY_LOGS_PER_PAGE;
    return logs.slice(start, start + SECURITY_LOGS_PER_PAGE);
  }, [logs, page]);

  if (!logs.length) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">No security events recorded.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {paginatedLogs.map((log) => (
          <article
            key={log.id}
            className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3 transition-colors hover:bg-[var(--surface-secondary)]/80"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {formatSecurityAction(log.action)}
                </p>
                {log.description ? (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">
                    {log.description}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                  log.status === 'SUCCESS'
                    ? 'bg-[var(--success)]/15 text-[var(--success)]'
                    : log.status === 'FAILED'
                      ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                      : 'bg-[var(--surface)] text-[var(--muted-foreground)]',
                )}
              >
                {log.status.toLowerCase()}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--muted-foreground)]">
              <span>{formatUserDateTime(log.createdAt)}</span>
              {log.ipAddress ? (
                <span dir="ltr">{log.ipAddress}</span>
              ) : null}
              {log.browser || log.os ? (
                <span>
                  {[log.browser, log.os].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <ClientPagination
        page={page}
        pageSize={SECURITY_LOGS_PER_PAGE}
        total={logs.length}
        onPageChange={setPage}
      />
    </div>
  );
}

export function UserSecurityPanel({ user, onUserUpdated }: UserSecurityPanelProps) {
  const [lockout, setLockout] = useState<UserLockoutStatus | null>(null);
  const [lockoutLoading, setLockoutLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyChannels, setNotifyChannels] = useState({
    inApp: true,
    email: true,
    whatsapp: true,
  });

  const loadLockout = useCallback(async () => {
    setLockoutLoading(true);
    try {
      const status = await hqApi.getUserLockout(user.id);
      setLockout(status);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load lockout status',
      );
    } finally {
      setLockoutLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    void loadLockout();
  }, [loadLockout]);

  async function handleSendNotification() {
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      appToast.error('Title and message are required');
      return;
    }
    if (!notifyChannels.inApp && !notifyChannels.email && !notifyChannels.whatsapp) {
      appToast.error('Select at least one delivery channel');
      return;
    }
    setActionLoading(true);
    try {
      const result = await hqApi.sendUserNotification(
        user.id,
        notifyTitle.trim(),
        notifyMessage.trim(),
        notifyChannels,
      );

      const delivered: string[] = [];
      if (result.delivered.inApp) delivered.push('in-app');
      if (result.delivered.email) delivered.push('email');
      if (result.delivered.whatsapp) delivered.push('WhatsApp');

      if (result.success) {
        const warnings: string[] = [];
        if (notifyChannels.email && !result.delivered.email) {
          warnings.push(result.errors.email ?? 'email failed');
        }
        if (notifyChannels.whatsapp && !result.delivered.whatsapp) {
          warnings.push(result.errors.whatsapp ?? 'WhatsApp failed');
        }

        if (warnings.length) {
          appToast.info(
            `Sent via ${delivered.join(', ')}. Could not deliver: ${warnings.join('; ')}`,
          );
        } else {
          appToast.success(`Notification sent via ${delivered.join(', ')}`);
        }
        setNotifyTitle('');
        setNotifyMessage('');
      } else {
        const failures = [
          result.errors.email,
          result.errors.whatsapp,
          !result.delivered.inApp ? 'in-app failed' : null,
        ].filter(Boolean);
        appToast.error(failures.join(' · ') || 'Could not send notification');
      }
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not send notification',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRevokeSessions() {
    setActionLoading(true);
    try {
      await hqApi.revokeUserSessions(user.id);
      appToast.success('All sessions revoked');
      onUserUpdated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not revoke sessions',
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnlockAccount() {
    setActionLoading(true);
    try {
      await hqApi.unlockUserAccount(user.id);
      appToast.success('Account unlocked');
      await loadLockout();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not unlock account',
      );
    } finally {
      setActionLoading(false);
    }
  }

  const currentSession = user.sessions[0] ?? null;

  return (
    <>
      <div className="space-y-4">
        <section className={detailPanelClassName}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            Sign-in overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Last sign-in
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                {formatUserDateTime(user.lastLoginAt)}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                {formatLastSeen(user.lastLoginAt)}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-secondary)] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                Active sessions
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                {user.sessions.length} device{user.sessions.length === 1 ? '' : 's'}
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                Two-factor: {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </section>

        <section className={detailPanelClassName}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Active sessions
              </h2>
              <p className="mt-1 max-w-xl text-xs text-[var(--muted-foreground)]">
                Each sign-in creates a session (up to 5 kept). Token refresh reuses the
                same session — multiple entries usually mean repeated logins, not
                intrusions.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg"
              isDisabled={actionLoading || user.sessions.length === 0}
              onPress={() => setRevokeOpen(true)}
            >
              <LogOut className="size-3.5" />
              Revoke all
            </Button>
          </div>

          {!user.sessions.length ? (
            <p className="text-sm text-[var(--muted-foreground)]">No active sessions.</p>
          ) : (
            <div className="space-y-2">
              {user.sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {sessionLabel(session)}
                        {index === 0 ? (
                          <span className="ms-2 rounded-full bg-[var(--success)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">
                            Most recent
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]" dir="ltr">
                        {session.ipAddress || 'Unknown IP'}
                        {session.location ? ` · ${session.location}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatUserDateTime(session.lastActivity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentSession ? (
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Current session is likely: {sessionLabel(currentSession)}
            </p>
          ) : null}
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
            Account lockout
          </h2>
          {lockoutLoading ? (
            <div className="flex min-h-[80px] items-center justify-center">
              <Loader2 className="size-5 animate-spin text-[var(--primary)]" />
            </div>
          ) : lockout ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface-secondary)] p-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {lockout.isLocked ? 'Account is locked' : 'Account is not locked'}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  Failed attempts: {lockout.recentAttempts}
                  {lockout.lockoutUntil
                    ? ` · Until ${formatUserDateTime(lockout.lockoutUntil)}`
                    : ''}
                </p>
              </div>
              {lockout.isLocked ? (
                <Button
                  size="sm"
                  className="h-8 rounded-lg"
                  isDisabled={actionLoading}
                  onPress={() => void handleUnlockAccount()}
                >
                  Unlock account
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
            Send notification
          </h2>
          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            Deliver a message via in-app notification, email, and/or WhatsApp.
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {(
                [
                  { id: 'inApp', label: 'In-app' },
                  { id: 'email', label: 'Email' },
                  { id: 'whatsapp', label: 'WhatsApp' },
                ] as const
              ).map((channel) => (
                <label
                  key={channel.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-xs font-medium"
                >
                  <input
                    type="checkbox"
                    checked={notifyChannels[channel.id]}
                    onChange={(e) =>
                      setNotifyChannels((current) => ({
                        ...current,
                        [channel.id]: e.target.checked,
                      }))
                    }
                    className="size-3.5 rounded border-[var(--border)]"
                  />
                  {channel.label}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)]" dir="ltr">
              {user.email}
              {user.phoneNumber ? ` · ${user.phoneNumber}` : ' · No phone on file'}
            </p>
            <input
              type="text"
              value={notifyTitle}
              onChange={(e) => setNotifyTitle(e.target.value)}
              placeholder="Notification title"
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 text-sm"
            />
            <textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value)}
              placeholder="Notification message"
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--field-background)] px-3 py-2 text-sm"
            />
            <Button
              className="h-10 gap-2 rounded-xl"
              isDisabled={
                actionLoading || !notifyTitle.trim() || !notifyMessage.trim()
              }
              onPress={() => void handleSendNotification()}
            >
              {actionLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send notification
            </Button>
          </div>
        </section>

        <section className={detailPanelClassName}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Security activity log
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Recent account security events, {SECURITY_LOGS_PER_PAGE} per page.
              </p>
            </div>
            {user.securityLogs.length > 0 ? (
              <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
                {user.securityLogs.length} events
              </span>
            ) : null}
          </div>

          <SecurityActivityLog logs={user.securityLogs} />
        </section>
      </div>

      <ConfirmDialog
        isOpen={revokeOpen}
        onOpenChange={setRevokeOpen}
        title="Revoke all sessions"
        description="The user will be signed out from all devices immediately."
        confirmLabel="Revoke sessions"
        isLoading={actionLoading}
        onConfirm={handleRevokeSessions}
      />
    </>
  );
}
