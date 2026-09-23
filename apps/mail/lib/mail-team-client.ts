import { sessionFetch } from "@/lib/api-client";

export type MailTeamRole = "ADMIN" | "BILLING" | "MEMBER" | "VIEWER";

export type MailAssignedMailbox = {
  id: string;
  localPart: string;
  domain: string;
};

export type MailTeamMailboxOption = MailAssignedMailbox & {
  assignedUserId: string | null;
  address: string;
};

export type MailTeamMemberView = {
  id: string;
  role: MailTeamRole;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  invitedAt: string;
  acceptedAt: string | null;
  expiresAt?: string | null;
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
  assignedMailboxes?: MailAssignedMailbox[];
};

export type MailTeamEmailInviteView = {
  id: string;
  kind: "email_invite";
  email: string;
  role: MailTeamRole;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  invitedAt: string;
  expiresAt: string;
  inviter: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type MailTeamRoster = {
  canManage: boolean;
  isOwner?: boolean;
  consoleMembersIncluded: number;
  consoleMembersUsed: number;
  owner: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    role: "OWNER";
    assignedMailboxes?: MailAssignedMailbox[];
  } | null;
  members: MailTeamMemberView[];
  emailInvites?: MailTeamEmailInviteView[];
  mailboxes?: MailTeamMailboxOption[];
  workspace?: {
    appId: string;
    name: string;
    primaryDomain: string | null;
  };
};

export type MailTeamInvitation = MailTeamMemberView & {
  workspace: {
    appId: string;
    name: string;
    primaryDomain: string | null;
  };
};

export type MailEmailInvitePreview = {
  email: string;
  role: MailTeamRole;
  expiresAt: string;
  workspace: {
    appId: string;
    name: string;
    primaryDomain: string | null;
  };
  inviter: {
    email: string;
    name: string | null;
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
    isOwner: Boolean(data.isOwner),
    consoleMembersIncluded: data.consoleMembersIncluded ?? 0,
    consoleMembersUsed: data.consoleMembersUsed ?? 0,
    owner: data.owner ?? null,
    members: data.members ?? [],
    emailInvites: data.emailInvites ?? [],
    mailboxes: data.mailboxes ?? [],
    workspace: data.workspace,
  };
}

export async function inviteMailTeamMember(
  appId: string,
  input: { email: string; role: MailTeamRole },
): Promise<{
  kind: "member" | "email_invite";
  needsSignup: boolean;
  member?: MailTeamMemberView;
  emailInvite?: MailTeamEmailInviteView;
}> {
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
  const data = await readJson<{
    kind?: "member" | "email_invite";
    needsSignup?: boolean;
    member?: MailTeamMemberView;
    emailInvite?: MailTeamEmailInviteView;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not send invite."));
  }
  return {
    kind: data.kind === "email_invite" ? "email_invite" : "member",
    needsSignup: Boolean(data.needsSignup),
    member: data.member,
    emailInvite: data.emailInvite,
  };
}

export async function resendMailTeamInvite(
  appId: string,
  memberId: string,
): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/members/${encodeURIComponent(memberId)}/resend`,
    { method: "POST" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not resend invite."));
  }
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

export async function transferMailOwnership(
  appId: string,
  memberId: string,
): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/transfer-ownership`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not transfer ownership."));
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

export async function previewMailEmailInvite(
  token: string,
): Promise<MailEmailInvitePreview> {
  const response = await fetch(`/api/v1/mail/invites/${encodeURIComponent(token)}`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const data = await readJson<MailEmailInvitePreview>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Invitation not found."));
  }
  return data;
}

export async function claimMailEmailInvite(
  token: string,
): Promise<{ appId: string; slotIndex: number }> {
  const response = await sessionFetch(
    `/api/v1/mail/invites/${encodeURIComponent(token)}/claim`,
    { method: "POST" },
  );
  const data = await readJson<{
    workspace?: { appId?: string; slotIndex?: number };
  }>(response);
  if (!response.ok || !data.workspace?.appId) {
    throw new Error(errorMessage(data, "Could not join workspace."));
  }
  return {
    appId: data.workspace.appId,
    slotIndex: data.workspace.slotIndex ?? 0,
  };
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
