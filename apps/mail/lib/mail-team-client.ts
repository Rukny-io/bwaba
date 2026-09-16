import { sessionFetch } from "@/lib/api-client";

export type MailTeamRole = "ADMIN" | "BILLING" | "MEMBER" | "VIEWER";

export type MailTeamMemberView = {
  id: string;
  role: MailTeamRole;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  invitedAt: string;
  acceptedAt: string | null;
  slotIndex: number | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  inviter: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type MailTeamRoster = {
  canManage: boolean;
  consoleMembersIncluded: number;
  consoleMembersUsed: number;
  owner: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: "OWNER";
  } | null;
  members: MailTeamMemberView[];
};

export type MailTeamInvitation = MailTeamMemberView & {
  workspace: {
    appId: string;
    name: string;
    primaryDomain: string | null;
  };
};

async function readJson<T>(
  response: Response,
): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(
  data: { message?: string | string[]; error?: string },
  fallback: string,
) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

export async function listMailTeam(appId: string): Promise<MailTeamRoster> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members`,
  );
  const data = await readJson<MailTeamRoster>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load team."));
  }
  return {
    canManage: Boolean(data.canManage),
    consoleMembersIncluded: data.consoleMembersIncluded ?? 0,
    consoleMembersUsed: data.consoleMembersUsed ?? 0,
    owner: data.owner ?? null,
    members: data.members ?? [],
  };
}

export async function inviteMailTeamMember(
  appId: string,
  input: { email: string; role: MailTeamRole },
): Promise<MailTeamMemberView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        role: input.role,
      }),
    },
  );
  const data = await readJson<{ member?: MailTeamMemberView }>(response);
  if (!response.ok || !data.member) {
    throw new Error(errorMessage(data, "Could not send invite."));
  }
  return data.member;
}

export async function updateMailTeamMember(
  appId: string,
  memberId: string,
  role: MailTeamRole,
): Promise<MailTeamMemberView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  const data = await readJson<{ member?: MailTeamMemberView }>(response);
  if (!response.ok || !data.member) {
    throw new Error(errorMessage(data, "Could not update member."));
  }
  return data.member;
}

export async function removeMailTeamMember(
  appId: string,
  memberId: string,
): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members/${encodeURIComponent(memberId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not remove member."));
  }
}

export async function leaveMailTeam(appId: string): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members/leave`,
    { method: "POST" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not leave workspace."));
  }
}

export async function listMailInvitations(): Promise<MailTeamInvitation[]> {
  const response = await sessionFetch("/api/v1/mail/invitations");
  const data = await readJson<{ invitations?: MailTeamInvitation[] }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load invitations."));
  }
  return data.invitations ?? [];
}

export async function acceptMailInvitation(
  memberId: string,
): Promise<{ appId: string; slotIndex: number }> {
  const response = await sessionFetch(
    `/api/v1/mail/invitations/${encodeURIComponent(memberId)}/accept`,
    { method: "POST" },
  );
  const data = await readJson<{
    workspace?: { appId?: string; slotIndex?: number };
  }>(response);
  if (!response.ok || !data.workspace?.appId) {
    throw new Error(errorMessage(data, "Could not accept invitation."));
  }
  return {
    appId: data.workspace.appId,
    slotIndex: data.workspace.slotIndex ?? 0,
  };
}

export async function declineMailInvitation(memberId: string): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/invitations/${encodeURIComponent(memberId)}/decline`,
    { method: "POST" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not decline invitation."));
  }
}

export async function assignMailMailbox(
  appId: string,
  mailboxId: string,
  userId: string | null,
): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not assign mailbox."));
  }
}
