'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Mail, Building2 } from 'lucide-react';
import { Button, EmptyState, AlertDialog } from '@heroui/react';
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
import { ACCOUNTS_URL } from '@/lib/config';

const BILLING_URL = `${ACCOUNTS_URL.replace(/\/$/, '')}/manage/billing`;

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
    <div className="space-y-5 sm:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            الفريق
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            ادعُ زملاءك للتعاون على نماذجك وحدّد صلاحيات كل عضو.
          </p>
        </div>
        <Button
          className="shrink-0 rounded-xl"
          onPress={openInviteFlow}
          isDisabled={planLoading}
        >
          <UserPlus className="size-4" aria-hidden />
          دعوة عضو
        </Button>
      </header>

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
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {workspaceDisplayName(inv)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                    دور {FORM_TEAM_ROLE_LABELS[inv.role]} ·{' '}
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
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/25 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {joinedWorkspaceName(membership)}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                      دورك: {FORM_TEAM_ROLE_LABELS[membership.role]}
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
        description="المستخدمون الذين يمكنهم الوصول لنماذجك."
      >
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل…</p>
        ) : accepted.length === 0 && pendingOutgoing.length === 0 ? (
          <EmptyState className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-base font-semibold text-[var(--foreground)]">
              لا يوجد أعضاء بعد
            </p>
            <p className="max-w-sm text-sm text-[var(--muted-foreground)]">
              ادعُ زملاءك للتعاون على إدارة النماذج والاستجابات.
            </p>
            {!teamEnabled && !planLoading ? (
              <Button
                variant="secondary"
                className="mt-1 rounded-full"
                onPress={openInviteFlow}
              >
                اكتشف باقة بلس
              </Button>
            ) : null}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {[...accepted, ...pendingOutgoing].map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {memberDisplayName(member)}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-[var(--muted-foreground)]" dir="ltr">
                    {member.user.email}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    {FORM_TEAM_STATUS_LABELS[member.status]}
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
        title="الأدوار والصلاحيات"
        description="ملخص ما يمكن لكل دور القيام به."
      >
        <ul className="space-y-3">
          {(Object.keys(FORM_TEAM_ROLE_LABELS) as FormTeamRole[]).map((role) => (
            <li
              key={role}
              className="flex items-start gap-3 rounded-xl bg-[var(--surface-secondary)]/40 px-4 py-3"
            >
              <FormTeamRoleIcon role={role} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {FORM_TEAM_ROLE_LABELS[role]}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
                  {FORM_TEAM_ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </li>
          ))}
        </ul>
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
    </div>
  );
}
