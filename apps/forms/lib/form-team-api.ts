import { api } from '@/lib/api-client';

export type FormTeamRole = 'ADMIN' | 'EDITOR' | 'ANALYST' | 'VIEWER';
export type FormTeamMemberStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface FormTeamMemberProfile {
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
}

export interface FormTeamMemberUser {
  id: string;
  email: string;
  profile?: FormTeamMemberProfile | null;
}

export interface FormTeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: FormTeamRole;
  permissions: string[];
  status: FormTeamMemberStatus;
  invitedAt: string;
  acceptedAt?: string | null;
  user: FormTeamMemberUser;
  inviter?: {
    id: string;
    email: string;
    profile?: FormTeamMemberProfile | null;
  };
}

export interface FormTeamInvitation {
  id: string;
  workspaceId: string;
  role: FormTeamRole;
  status: FormTeamMemberStatus;
  invitedAt: string;
  workspace: {
    id: string;
    email: string;
    profile?: FormTeamMemberProfile | null;
  };
  inviter?: {
    profile?: FormTeamMemberProfile | null;
  };
}

export const FORM_TEAM_ROLE_LABELS: Record<FormTeamRole, string> = {
  ADMIN: 'مدير',
  EDITOR: 'محرر',
  ANALYST: 'محلل',
  VIEWER: 'مشاهد',
};

export const FORM_TEAM_ROLE_DESCRIPTIONS: Record<FormTeamRole, string> = {
  ADMIN: 'إدارة كاملة للنماذج والفريق',
  EDITOR: 'تعديل النماذج وعرض الاستجابات',
  ANALYST: 'عرض الاستجابات والتحليلات فقط',
  VIEWER: 'عرض الاستجابات فقط',
};

export const FORM_TEAM_STATUS_LABELS: Record<FormTeamMemberStatus, string> = {
  PENDING: 'معلّقة',
  ACCEPTED: 'نشط',
  DECLINED: 'مرفوضة',
  EXPIRED: 'منتهية',
  CANCELLED: 'ملغاة',
};

export interface FormTeamWorkspace {
  memberId: string;
  workspaceId: string;
  role: FormTeamRole;
  permissions: string[];
  acceptedAt?: string | null;
  workspace: {
    id: string;
    email: string;
    profile?: FormTeamMemberProfile | null;
  };
}

export async function listTeamWorkspaces(): Promise<FormTeamWorkspace[]> {
  const { data } = await api.get<FormTeamWorkspace[]>('/forms/team/workspaces');
  return data;
}

export async function leaveTeamWorkspace(
  workspaceId: string,
): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>(
    `/forms/team/workspaces/${workspaceId}/leave`,
  );
  return data;
}

export async function listTeamMembers(): Promise<FormTeamMember[]> {
  const { data } = await api.get<FormTeamMember[]>('/forms/team');
  return data;
}

export async function listTeamInvitations(): Promise<FormTeamInvitation[]> {
  const { data } = await api.get<FormTeamInvitation[]>(
    '/forms/team/invitations',
  );
  return data;
}

export async function inviteTeamMember(payload: {
  email: string;
  role: FormTeamRole;
}): Promise<FormTeamMember> {
  const { data } = await api.post<FormTeamMember>(
    '/forms/team/invite',
    payload,
  );
  return data;
}

export async function updateTeamMember(
  memberId: string,
  payload: { role: FormTeamRole },
): Promise<FormTeamMember> {
  const { data } = await api.patch<FormTeamMember>(
    `/forms/team/${memberId}`,
    payload,
  );
  return data;
}

export async function removeTeamMember(
  memberId: string,
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `/forms/team/${memberId}`,
  );
  return data;
}

export async function acceptTeamInvitation(
  memberId: string,
): Promise<FormTeamMember> {
  const { data } = await api.post<FormTeamMember>(
    `/forms/team/invitations/${memberId}/accept`,
  );
  return data;
}

export async function declineTeamInvitation(
  memberId: string,
): Promise<FormTeamMember> {
  const { data } = await api.post<FormTeamMember>(
    `/forms/team/invitations/${memberId}/decline`,
  );
  return data;
}
