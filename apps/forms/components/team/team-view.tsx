'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Mail,
  Building2,
  Clock3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button, AlertDialog } from '@heroui/react';
import { ApiException } from '@/lib/api-client';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import {
  acceptTeamInvitation,
  declineTeamInvitation,
  inviteTeamMember,
  leaveTeamWorkspace,
  listTeamInvitations,
  listTeamMembers,
  listTeamWorkspaces,
  removeTeamMember,
  updateTeamMember,
  FORM_TEAM_ROLE_DESCRIPTIONS,
  FORM_TEAM_ROLE_LABELS,
  FORM_TEAM_STATUS_LABELS,
  type FormTeamInvitation,
  type FormTeamMember,
  type FormTeamRole,
  type FormTeamWorkspace,
} from '@/lib/form-team-api';
import { planDisplayName } from '@/lib/api/subscriptions';
import {
  PlanUpgradeBanner,
  usePlanFeature,
} from '@/components/plan/plan-feature-gate';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { TeamInviteDialog } from '@/components/team/team-invite-dialog';
import { FormTeamRoleIcon, FormTeamRoleSelect } from '@/components/team/form-team-role-select';
import { TeamUpgradeDialog } from '@/components/team/team-upgrade-dialog';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardEmptyState } from '@/components/app/dashboard-empty-state';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { ACCOUNTS_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

const BILLING_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/manage/billing`;

function TeamSummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint: string;
  accent?: boolean;
}) {
  return (
    <DashboardSurface
      padding="sm"
      className={cn('flex items-center gap-3', accent && 'ring-1 ring-[var(--primary)]/10')}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--muted-foreground)]">{label}</p>
        <p
          className="text-lg font-bold tabular-nums text-[var(--foreground)]"
          dir="ltr"
          lang="en"
        >
          {value}
        </p>
        <p className="text-[10px] text-[var(--muted-foreground)]/80">{hint}</p>
      </div>
    </DashboardSurface>
  );
}

function statusPillClassName(status: string) {
  return cn(
    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
    status === 'ACCEPTED' && 'bg-[var(--success)]/15 text-[var(--success)]',
    status === 'PENDING' && 'bg-[var(--warning)]/15 text-[var(--warning)]',
    status !== 'ACCEPTED' &&
      status !== 'PENDING' &&
      'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
  );
}

const teamRowClassName =
  'flex flex-col gap-3 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between';

function memberDisplayName(member: FormTeamMember): string {
  return (
    member.user.profile?.name?.trim() ||
    member.user.profile?.username?.trim() ||
    member.user.email
  );
}

function workspaceDisplayName(inv: FormTeamInvitation): string {
  return (
    inv.workspace.profile?.name?.trim() ||
    inv.workspace.profile?.username?.trim() ||
    inv.workspace.email
  );
}

function joinedWorkspaceName(workspace: FormTeamWorkspace): string {
  return (
    workspace.workspace.profile?.name?.trim() ||
    workspace.workspace.profile?.username?.trim() ||
    workspace.workspace.email
  );
}

function formatAcceptedDate(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

export function TeamView() {
  const { enabled: teamEnabled, plan, loading: planLoading } =
    usePlanFeature('formTeam');

  const [members, setMembers] = useState<FormTeamMember[]>([]);
  const [invitations, setInvitations] = useState<FormTeamInvitation[]>([]);
  const [joinedWorkspaces, setJoinedWorkspaces] = useState<FormTeamWorkspace[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeDetail, setUpgradeDetail] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<FormTeamWorkspace | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamResult, pendingResult, workspacesResult] =
        await Promise.allSettled([
          listTeamMembers(),
          listTeamInvitations(),
          listTeamWorkspaces(),
        ]);

      if (teamResult.status === 'fulfilled') {
        setMembers(Array.isArray(teamResult.value) ? teamResult.value : []);
      } else if (
        teamResult.reason instanceof ApiException &&
        teamResult.reason.statusCode === 403
      ) {
        setMembers([]);
      } else if (teamResult.status === 'rejected') {
        throw teamResult.reason;
      }

      if (pendingResult.status === 'fulfilled') {
        setInvitations(
          Array.isArray(pendingResult.value) ? pendingResult.value : [],
        );
      } else if (pendingResult.status === 'rejected') {
        throw pendingResult.reason;
      }

      if (workspacesResult.status === 'fulfilled') {
        setJoinedWorkspaces(
          Array.isArray(workspacesResult.value) ? workspacesResult.value : [],
        );
      } else {
        setJoinedWorkspaces([]);
      }
    } catch (e) {
      appToast.fromError(e, 'تعذّر تحميل بيانات الفريق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openInviteFlow() {
    if (!teamEnabled) {
      setUpgradeDetail(null);
      setUpgradeOpen(true);
      return;
    }
    setInviteOpen(true);
  }

  async function handleInvite(email: string, role: FormTeamRole) {
    try {
      await inviteTeamMember({ email, role });
      appToast.success('تم إرسال الدعوة بنجاح', {
        description: 'سيصل للمدعو إشعار وبريد للقبول.',
      });
      setInviteOpen(false);
      await load();
    } catch (e) {
      if (e instanceof ApiException && e.statusCode === 403) {
        setInviteOpen(false);
        setUpgradeDetail(getApiErrorMessage(e));
        setUpgradeOpen(true);
        return;
      }
      throw e;
    }
  }

  async function handleRoleChange(memberId: string, role: FormTeamRole) {
    setBusyId(memberId);
    try {
      await updateTeamMember(memberId, { role });
      appToast.success('تم تحديث الدور');
      await load();
    } catch (e) {
      appToast.fromError(e, 'تعذّر تحديث الدور');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(memberId: string) {
    setBusyId(memberId);
    try {
      await removeTeamMember(memberId);
      appToast.success('تمت إزالة العضو');
      await load();
    } catch (e) {
      appToast.fromError(e, 'تعذّر إزالة العضو');
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccept(memberId: string) {
    setBusyId(memberId);
    try {
      await acceptTeamInvitation(memberId);
      appToast.success('انضممت للفريق', {
        description: 'يمكنك الآن الوصول لنماذج مساحة العمل.',
      });
      await load();
    } catch (e) {
      appToast.fromError(e, 'تعذّر قبول الدعوة');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(memberId: string) {
    setBusyId(memberId);
    try {
      await declineTeamInvitation(memberId);
      appToast.info('تم رفض الدعوة');
      await load();
    } catch (e) {
      appToast.fromError(e, 'تعذّر رفض الدعوة');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmLeaveWorkspace() {
    if (!leaveTarget) return;
    const workspaceId = leaveTarget.workspaceId;
    setBusyId(workspaceId);
    try {
      await leaveTeamWorkspace(workspaceId);
      appToast.success('غادرت الفريق', {
        description: `لم تعد تملك وصولاً لنماذج ${joinedWorkspaceName(leaveTarget)}.`,
      });
      setLeaveTarget(null);
      await load();
    } catch (e) {
      appToast.fromError(e, 'تعذّر مغادرة الفريق');
    } finally {
      setBusyId(null);
    }
  }

  const accepted = members.filter((m) => m.status === 'ACCEPTED');
  const pendingOutgoing = members.filter((m) => m.status === 'PENDING');

  return (
    <>
      <DashboardPageHeader
        title="الفريق"
        description="نظّم التعاون على نماذجك، تابع الدعوات، وحدّد صلاحيات كل عضو بوضوح."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/app/forms">
              <Button variant="secondary" className="shrink-0 rounded-xl">
                النماذج
              </Button>
            </Link>
            <Button
              className="shrink-0 rounded-xl"
              onPress={openInviteFlow}
              isDisabled={planLoading}
            >
              <UserPlus className="size-4" aria-hidden />
              دعوة عضو
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TeamSummaryCard
          icon={Users}
          label="أعضاء نشطون"
          value={accepted.length}
          hint="يملكون وصولاً فعلياً إلى نماذجك"
          accent
        />
        <TeamSummaryCard
          icon={Clock3}
          label="دعوات صادرة"
          value={pendingOutgoing.length}
          hint="بانتظار قبول من دعوتهم"
        />
        <TeamSummaryCard
          icon={Mail}
          label="دعوات واردة"
          value={invitations.length}
          hint="مساحات عمل دعتك للانضمام"
        />
        <TeamSummaryCard
          icon={Building2}
          label="فرق منضم إليها"
          value={joinedWorkspaces.length}
          hint="مساحات عمل تشاركك الوصول"
        />
      </div>

      {!planLoading && !teamEnabled ? (
        <PlanUpgradeBanner
          feature="formTeam"
          plan={plan}
          description={`خطتك الحالية (${planDisplayName(plan)}) لا تتضمن فريق العمل. ترقّ إلى بلس لدعوة حتى عضوين.`}
          upgradeHref={BILLING_URL}
        />
      ) : null}

      {invitations.length > 0 ? (
        <SettingsSectionCard
          icon={Mail}
          title="دعواتك المعلّقة"
          description="مساحات عمل دعاك للانضمام إليها."
        >
          <ul className="space-y-3">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className={teamRowClassName}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {workspaceDisplayName(inv)}
                    </p>
                    <span className={statusPillClassName(inv.status)}>
                      {FORM_TEAM_STATUS_LABELS[inv.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                    دور {FORM_TEAM_ROLE_LABELS[inv.role]} · من{' '}
                    {inv.inviter?.profile?.name || 'عضو الفريق'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl"
                    isDisabled={busyId === inv.id}
                    onPress={() => void handleAccept(inv.id)}
                  >
                    قبول
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl"
                    isDisabled={busyId === inv.id}
                    onPress={() => void handleDecline(inv.id)}
                  >
                    رفض
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </SettingsSectionCard>
      ) : null}

      {joinedWorkspaces.length > 0 ? (
        <SettingsSectionCard
          icon={Building2}
          title="مساحات انضممت إليها"
          description="فرق عمل شاركتك نماذجها بعد قبول الدعوة."
        >
          <ul className="space-y-3">
            {joinedWorkspaces.map((membership) => {
              const acceptedLabel = formatAcceptedDate(membership.acceptedAt);

              return (
                <li
                  key={membership.workspaceId}
                  className={teamRowClassName}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {joinedWorkspaceName(membership)}
                      </p>
                      <span className="inline-flex rounded-full bg-[var(--surface-tertiary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                        {FORM_TEAM_ROLE_LABELS[membership.role]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                      مساحة عمل تشاركك الوصول إلى النماذج
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                      {FORM_TEAM_ROLE_DESCRIPTIONS[membership.role]}
                      {acceptedLabel ? ` · انضممت في ${acceptedLabel}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link href="/app/forms">
                      <Button size="sm" variant="secondary" className="rounded-xl">
                        عرض النماذج
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      className="rounded-xl"
                      isDisabled={busyId === membership.workspaceId}
                      onPress={() => setLeaveTarget(membership)}
                    >
                      مغادرة الفريق
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </SettingsSectionCard>
      ) : null}

      <SettingsSectionCard
        icon={Users}
        title="أعضاء الفريق"
        description="كل الأعضاء المرتبطين بمساحة عملك، مع حالة الدعوة والدور الحالي."
      >
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل…</p>
        ) : accepted.length === 0 && pendingOutgoing.length === 0 ? (
          <DashboardEmptyState
            compact
            title="لا يوجد أعضاء بعد"
            description="ادعُ زملاءك للتعاون على إدارة النماذج والاستجابات."
          >
            {!teamEnabled && !planLoading ? (
              <Button
                variant="secondary"
                className="rounded-full"
                onPress={openInviteFlow}
              >
                اكتشف باقة بلس
              </Button>
            ) : null}
          </DashboardEmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {[...accepted, ...pendingOutgoing].map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {memberDisplayName(member)}
                    </p>
                    <span className={statusPillClassName(member.status)}>
                      {FORM_TEAM_STATUS_LABELS[member.status]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
                    {member.user.email}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--muted-foreground)]">
                    {FORM_TEAM_ROLE_DESCRIPTIONS[member.role]}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <FormTeamRoleSelect
                    value={member.role}
                    onChange={(nextRole) =>
                      void handleRoleChange(member.id, nextRole)
                    }
                    isDisabled={busyId === member.id || member.status !== 'ACCEPTED'}
                    className="w-[8.5rem] shrink-0"
                    aria-label={`دور ${memberDisplayName(member)}`}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl text-red-600"
                    isDisabled={busyId === member.id}
                    onPress={() => void handleRemove(member.id)}
                  >
                    إزالة
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        icon={Users}
        title="حالة الفريق والعمل"
        description="ملخص تشغيلي سريع يساعدك تعرف أين تركز الآن."
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <DashboardSurface padding="sm" className="space-y-1.5">
              <p className="text-[11px] text-[var(--muted-foreground)]">أعضاء نشطون</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{accepted.length}</p>
            </DashboardSurface>
            <DashboardSurface padding="sm" className="space-y-1.5">
              <p className="text-[11px] text-[var(--muted-foreground)]">دعوات صادرة</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{pendingOutgoing.length}</p>
            </DashboardSurface>
            <DashboardSurface padding="sm" className="space-y-1.5">
              <p className="text-[11px] text-[var(--muted-foreground)]">دعوات واردة</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{invitations.length}</p>
            </DashboardSurface>
            <DashboardSurface padding="sm" className="space-y-1.5">
              <p className="text-[11px] text-[var(--muted-foreground)]">فرق منضم إليها</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{joinedWorkspaces.length}</p>
            </DashboardSurface>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <DashboardSurface as="article" padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">مؤشر التعاون</h3>
                <Clock3 className="size-4 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-3xl font-bold tabular-nums text-[var(--foreground)]" dir="ltr" lang="en">
                {pendingOutgoing.length + accepted.length > 0
                  ? `${Math.round((accepted.length / (accepted.length + pendingOutgoing.length)) * 100)}%`
                  : '0%'}
              </p>
              <p className="text-[12px] text-[var(--muted-foreground)]">
                نسبة الدعوات التي تحولت إلى أعضاء نشطين.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--surface-tertiary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                  {accepted.length > 0 ? 'الفريق يعمل' : 'فردي حالياً'}
                </span>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  الخطة: {planDisplayName(plan)}
                </span>
              </div>
            </DashboardSurface>

            <DashboardSurface as="article" padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">أولويات العمل الآن</h3>
                {(invitations.length > 0 || pendingOutgoing.length > 0 || accepted.length === 0 || (!teamEnabled && !planLoading)) ? (
                  <AlertCircle className="size-4 text-[var(--warning)]" />
                ) : (
                  <CheckCircle2 className="size-4 text-[var(--success)]" />
                )}
              </div>
              <ul className="space-y-2 text-[12px] text-[var(--muted-foreground)]">
                {invitations.length > 0 ? (
                  <li className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2">لديك دعوات واردة تحتاج قبول/رفض.</li>
                ) : null}
                {pendingOutgoing.length > 0 ? (
                  <li className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2">تابع الدعوات الصادرة المعلّقة مع الأعضاء.</li>
                ) : null}
                {accepted.length === 0 ? (
                  <li className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2">ابدأ بدعوة أول عضو لتفعيل التعاون.</li>
                ) : null}
                {!teamEnabled && !planLoading ? (
                  <li className="rounded-xl bg-[var(--warning)]/10 px-3 py-2">الترقية مطلوبة لفتح ميزات الفريق المتقدمة.</li>
                ) : null}
                {invitations.length === 0 &&
                pendingOutgoing.length === 0 &&
                accepted.length > 0 &&
                (teamEnabled || planLoading) ? (
                  <li className="rounded-xl bg-[var(--success)]/10 px-3 py-2">لا يوجد إجراء عاجل، فريقك مستقر حالياً.</li>
                ) : null}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" className="rounded-xl" onPress={openInviteFlow}>
                  <UserPlus className="size-4" aria-hidden />
                  دعوة عضو
                </Button>
                <Link href="/app/analytics">
                  <Button size="sm" variant="secondary" className="rounded-xl">
                    متابعة الأداء
                  </Button>
                </Link>
                {!teamEnabled && !planLoading ? (
                  <Link href={BILLING_URL} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="secondary" className="rounded-xl">
                      ترقية الخطة
                    </Button>
                  </Link>
                ) : null}
              </div>
            </DashboardSurface>
          </div>
        </div>
      </SettingsSectionCard>

      <TeamInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />

      <TeamUpgradeDialog
        open={upgradeOpen}
        plan={plan}
        detail={upgradeDetail}
        onClose={() => {
          setUpgradeOpen(false);
          setUpgradeDetail(null);
        }}
      />

      <AlertDialog.Backdrop
        isOpen={!!leaveTarget}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
        isDismissable
      >
        <AlertDialog.Container size="md">
          <AlertDialog.Dialog>
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Heading>مغادرة الفريق؟</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                ستفقد الوصول إلى نماذج{' '}
                <span className="font-semibold text-[var(--foreground)]">
                  {leaveTarget ? joinedWorkspaceName(leaveTarget) : ''}
                </span>
                . يمكنك الانضمام مجدداً إذا أُرسلت دعوة جديدة.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setLeaveTarget(null)}>
                إلغاء
              </Button>
              <Button
                variant="danger"
                isDisabled={!!busyId}
                onPress={() => void confirmLeaveWorkspace()}
              >
                مغادرة الفريق
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
