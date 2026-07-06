'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  BadgeCheck,
  ClipboardList,
  CreditCard,
  Loader2,
  Lock,
  Shield,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { formatNumber } from '@/lib/dashboard-format';
import type { AdminUserDetail } from '@/lib/types/users';
import {
  displayUserName,
  formatRole,
  formatUserDateTime,
  formatVerificationLevel,
  roleBadgeClass,
} from '@/lib/users-format';
import { UserBillingPanel } from '@/components/users/user-billing-panel';
import { UserActionsPanel } from '@/components/users/user-actions-panel';
import { UserVerificationPanel } from '@/components/users/user-verification-panel';
import { UserSecurityPanel } from '@/components/users/user-security-panel';
import { UserAdminPanel } from '@/components/users/user-admin-panel';
import { UserAvatar } from '@/components/users/user-avatar';
import {
  detailPanelClassName,
  workspaceTabClassName,
  workspaceTabGroupClassName,
} from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

type UserDetailTab =
  | 'overview'
  | 'verification'
  | 'security'
  | 'billing'
  | 'admin'
  | 'actions';

const TAB_IDS: UserDetailTab[] = [
  'overview',
  'verification',
  'security',
  'billing',
  'admin',
  'actions',
];

const TABS: { id: UserDetailTab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'verification', label: 'Verification', icon: BadgeCheck },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'admin', label: 'Admin', icon: ClipboardList },
  { id: 'actions', label: 'Actions', icon: Shield },
];

function parseTabParam(value: string | null): UserDetailTab {
  if (value && TAB_IDS.includes(value as UserDetailTab)) {
    return value as UserDetailTab;
  }
  return 'overview';
}

interface UserDetailViewProps {
  userId: string;
  currentAdminId: string;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[65%] text-end text-xs font-medium text-[var(--foreground)]" dir="ltr">
        {value}
      </span>
    </div>
  );
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function connectedAccounts(user: AdminUserDetail): string {
  const accounts = [
    user.hasGoogle ? 'Google' : null,
    user.hasLinkedin ? 'LinkedIn' : null,
    user.hasTelegram
      ? `Telegram${user.telegramUsername ? ` (@${user.telegramUsername})` : ''}`
      : null,
  ].filter(Boolean);

  return accounts.length ? accounts.join(' · ') : 'None';
}

function OverviewPanel({ user }: { user: AdminUserDetail }) {
  const phone = user.phoneNumber?.trim() || '—';
  const phoneStatus = user.phoneNumber
    ? user.phoneVerified
      ? 'Verified'
      : 'Not verified'
    : '—';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Contact</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={phone} />
          <DetailRow label="Phone status" value={phoneStatus} />
          <DetailRow label="User ID" value={user.id} />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Account</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Role" value={formatRole(user.role)} />
          <DetailRow label="Account type" value={user.accountType} />
          <DetailRow label="Email verified" value={yesNo(user.emailVerified)} />
          <DetailRow label="Profile complete" value={yesNo(user.profileCompleted)} />
          <DetailRow
            label="Two-factor auth"
            value={user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          />
          <DetailRow
            label="Identity verification"
            value={formatVerificationLevel(user.verificationLevel)}
          />
          <DetailRow
            label="Rukny Verified"
            value={
              user.isRuknyVerified
                ? `Yes${user.ruknyVerifiedAt ? ` · ${formatUserDateTime(user.ruknyVerifiedAt)}` : ''}`
                : 'No'
            }
          />
          <DetailRow
            label="Account status"
            value={
              user.isDeactivated
                ? `Deactivated${user.deactivatedAt ? ` · ${formatUserDateTime(user.deactivatedAt)}` : ''}`
                : 'Active'
            }
          />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: `?tab=verification`, label: 'Verification' },
            { href: `?tab=security`, label: 'Security' },
            { href: `?tab=billing`, label: 'Billing' },
            { href: `?tab=admin`, label: 'Admin notes' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="inline-flex h-8 items-center rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-medium transition-colors hover:bg-[var(--surface-tertiary)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Timeline</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Last sign-in" value={formatUserDateTime(user.lastLoginAt)} />
          <DetailRow label="Joined" value={formatUserDateTime(user.createdAt)} />
          <DetailRow label="Last updated" value={formatUserDateTime(user.updatedAt)} />
          <DetailRow
            label="Active sessions"
            value={formatNumber(user.counts.sessions)}
          />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Connected accounts</h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Sign-in methods" value={connectedAccounts(user)} />
          <DetailRow label="Google linked" value={yesNo(user.hasGoogle)} />
          <DetailRow label="LinkedIn linked" value={yesNo(user.hasLinkedin)} />
          <DetailRow
            label="Telegram linked"
            value={
              user.hasTelegram
                ? user.telegramUsername
                  ? `@${user.telegramUsername}`
                  : 'Yes'
                : 'No'
            }
          />
        </div>
      </section>

      {user.profile ? (
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Profile</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            <DetailRow label="Display name" value={user.profile.name?.trim() || '—'} />
            <DetailRow
              label="Username"
              value={user.profile.username ? `@${user.profile.username}` : '—'}
            />
            <DetailRow label="Visibility" value={user.profile.visibility} />
            {user.profile.bio ? <DetailRow label="Bio" value={user.profile.bio} /> : null}
            <DetailRow
              label="Storage"
              value={`${formatNumber(user.profile.storageUsed)} / ${formatNumber(user.profile.storageLimit)}`}
            />
          </div>
        </section>
      ) : (
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Profile</h2>
          <p className="text-sm text-[var(--muted-foreground)]">No profile created yet.</p>
        </section>
      )}

      {user.store ? (
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Store</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            <DetailRow label="Name" value={user.store.name} />
            <DetailRow label="Slug" value={user.store.slug} />
            <DetailRow label="Status" value={user.store.status} />
          </div>
        </section>
      ) : null}

      <section className={cn(detailPanelClassName, 'lg:col-span-2')}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Activity</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Orders', value: user.counts.orders },
            { label: 'Forms', value: user.counts.forms },
            { label: 'Events', value: user.counts.events },
            { label: 'Posts', value: user.counts.posts },
            { label: 'Files', value: user.counts.files },
            { label: 'Followers', value: user.counts.followers },
            { label: 'Following', value: user.counts.following },
            { label: 'Comments', value: user.counts.comments },
            { label: 'Reviews', value: user.counts.reviews },
            { label: 'Sessions', value: user.counts.sessions },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-[var(--surface-secondary)] px-3 py-3 text-center"
            >
              <p className="text-lg font-bold tabular-nums" dir="ltr">
                {formatNumber(item.value)}
              </p>
              <p className="text-[11px] text-[var(--muted-foreground)]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function UserDetailView({ userId, currentAdminId }: UserDetailViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UserDetailTab>(() =>
    parseTabParam(searchParams.get('tab')),
  );

  useEffect(() => {
    setActiveTab(parseTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hqApi.getUser(userId);
      setUser(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load user details',
      );
      router.replace('/app/users');
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const displayName = displayUserName(user.profile?.name ?? null, user.email);

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href="/app/users"
            className="inline-flex items-center gap-1 rounded-lg py-0.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            Users
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                roleBadgeClass(user.role),
              )}
            >
              {formatRole(user.role)}
            </span>
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium',
                user.isDeactivated
                  ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                  : user.emailVerified
                    ? 'bg-[var(--success)]/15 text-[var(--success)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
              )}
            >
              {user.isDeactivated
                ? 'Deactivated'
                : user.emailVerified
                  ? 'Verified'
                  : 'Unverified'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface-secondary)] text-base font-semibold">
            <UserAvatar
              src={user.profile?.avatar}
              name={user.profile?.name}
              email={user.email}
              initialsClassName="text-base"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
              {displayName}
            </h1>
            <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>

        <nav
          className={workspaceTabGroupClassName}
          aria-label="User detail sections"
          role="tablist"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveTab(tab.id);
                  const params = new URLSearchParams(searchParams.toString());
                  if (tab.id === 'overview') {
                    params.delete('tab');
                  } else {
                    params.set('tab', tab.id);
                  }
                  const qs = params.toString();
                  router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
                }}
                className={workspaceTabClassName(isActive)}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div role="tabpanel">
        {activeTab === 'overview' ? <OverviewPanel user={user} /> : null}
        {activeTab === 'verification' ? (
          <UserVerificationPanel userId={user.id} onUserUpdated={() => void loadUser()} />
        ) : null}
        {activeTab === 'security' ? (
          <UserSecurityPanel user={user} onUserUpdated={() => void loadUser()} />
        ) : null}
        {activeTab === 'billing' ? <UserBillingPanel userId={user.id} /> : null}
        {activeTab === 'admin' ? <UserAdminPanel userId={user.id} /> : null}
        {activeTab === 'actions' ? (
          <UserActionsPanel
            user={user}
            currentAdminId={currentAdminId}
            onUserUpdated={() => void loadUser()}
          />
        ) : null}
      </div>
    </div>
  );
}
