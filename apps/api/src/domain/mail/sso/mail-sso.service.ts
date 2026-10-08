import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  InvitationStatus,
  MailAppMemberRole,
  MailAppStatus,
  MailMailboxStatus,
  type MailAppSsoSettings,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { EmailService } from '../../../integrations/email/email.service';
import {
  MailAppAccessService,
  type MailAppAccess,
} from '../mail-app-access.service';
import { MailMailboxSessionService } from '../mail-mailbox-session.service';
import { MailMailboxesService } from '../mail-mailboxes.service';
import { MailMembersService } from '../mail-members.service';
import {
  ConsumeMailSsoLinkDto,
  ProvisionMailSsoBulkDto,
  ProvisionMailSsoDto,
  ResendMailSsoLinkDto,
  UpdateMailSsoSettingsDto,
} from './dto/mail-sso.dto';
import {
  hashMailSsoToken,
  isWellFormedMailSsoToken,
  mailSsoLinkStatus,
  newMailSsoToken,
} from './mail-sso-token.util';

const LINK_RESEND_COOLDOWN_MS = 60_000;

const DEFAULT_SETTINGS = {
  quickLinkEnabled: true,
  autoAcceptOnLink: true,
  skipMailboxPasswordForAssigned: true,
  linkTtlHours: 72,
  allowedEmailDomains: [] as string[],
};

type SsoSettingsView = typeof DEFAULT_SETTINGS;

export type MailSsoConsumeResult =
  | {
      needsConfirmation: true;
      workspace: { appId: string; name: string };
    }
  | {
      needsConfirmation: false;
      workspace: { appId: string; name: string; slotIndex: number };
      mailbox: { id: string; address: string } | null;
      mailboxSessionToken: string | null;
    };

@Injectable()
export class MailSsoService {
  private readonly logger = new Logger(MailSsoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MailAppAccessService,
    private readonly members: MailMembersService,
    private readonly mailboxes: MailMailboxesService,
    private readonly mailboxSessions: MailMailboxSessionService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private mailAppUrl(path: string): string {
    const base = (
      this.config.get<string>('NEXT_PUBLIC_MAIL_URL') ||
      this.config.get<string>('MAIL_APP_URL') ||
      'https://mail.rukny.io'
    ).replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private linkUrl(token: string) {
    return this.mailAppUrl(`/sso/open/${token}`);
  }

  private normalizeEmail(raw: string) {
    return raw.trim().toLowerCase();
  }

  private toSettingsView(row: MailAppSsoSettings | null): SsoSettingsView {
    if (!row) return { ...DEFAULT_SETTINGS, allowedEmailDomains: [] };
    return {
      quickLinkEnabled: row.quickLinkEnabled,
      autoAcceptOnLink: row.autoAcceptOnLink,
      skipMailboxPasswordForAssigned: row.skipMailboxPasswordForAssigned,
      linkTtlHours: row.linkTtlHours,
      allowedEmailDomains: row.allowedEmailDomains,
    };
  }

  private async loadSettings(mailAppId: string): Promise<SsoSettingsView> {
    const row = await this.prisma.mailAppSsoSettings.findUnique({
      where: { mailAppId },
    });
    return this.toSettingsView(row);
  }

  private async requireManager(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can manage SSO.',
      });
    }
    return access;
  }

  private assertQuickLinksEnabled(settings: SsoSettingsView) {
    if (!settings.quickLinkEnabled) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_SSO_DISABLED',
        message: 'Quick sign-in links are turned off for this workspace.',
      });
    }
  }

  private assertEmailDomainAllowed(email: string, settings: SsoSettingsView) {
    if (!settings.allowedEmailDomains.length) return;
    const domain = email.split('@')[1] ?? '';
    if (!settings.allowedEmailDomains.includes(domain)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'MAIL_SSO_DOMAIN_NOT_ALLOWED',
        message: `Quick sign-in is limited to: ${settings.allowedEmailDomains.join(', ')}.`,
      });
    }
  }

  private linkView(link: {
    id: string;
    email: string;
    mailboxId: string | null;
    expiresAt: Date;
    usedAt: Date | null;
    revokedAt: Date | null;
    lastSentAt: Date;
    createdAt: Date;
  }) {
    return {
      id: link.id,
      email: link.email,
      mailboxId: link.mailboxId,
      status: mailSsoLinkStatus(link),
      expiresAt: link.expiresAt.toISOString(),
      usedAt: link.usedAt?.toISOString() ?? null,
      lastSentAt: link.lastSentAt.toISOString(),
      createdAt: link.createdAt.toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Settings + overview
  // ---------------------------------------------------------------------------

  async getSettings(userId: string, publicAppId: string) {
    const access = await this.requireManager(userId, publicAppId);
    return { settings: await this.loadSettings(access.app.id) };
  }

  async updateSettings(
    userId: string,
    publicAppId: string,
    dto: UpdateMailSsoSettingsDto,
  ) {
    const access = await this.requireManager(userId, publicAppId);
    const data: Partial<SsoSettingsView> = {};
    if (dto.quickLinkEnabled !== undefined) data.quickLinkEnabled = dto.quickLinkEnabled;
    if (dto.autoAcceptOnLink !== undefined) data.autoAcceptOnLink = dto.autoAcceptOnLink;
    if (dto.skipMailboxPasswordForAssigned !== undefined) {
      data.skipMailboxPasswordForAssigned = dto.skipMailboxPasswordForAssigned;
    }
    if (dto.linkTtlHours !== undefined) data.linkTtlHours = dto.linkTtlHours;
    if (dto.allowedEmailDomains !== undefined) {
      data.allowedEmailDomains = [
        ...new Set(
          dto.allowedEmailDomains
            .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
            .filter(Boolean),
        ),
      ];
    }

    const row = await this.prisma.mailAppSsoSettings.upsert({
      where: { mailAppId: access.app.id },
      create: { mailAppId: access.app.id, ...data },
      update: data,
    });

    if (data.quickLinkEnabled === false) {
      await this.prisma.mailSsoAccessLink.updateMany({
        where: { mailAppId: access.app.id, usedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (data.skipMailboxPasswordForAssigned === false) {
      await this.revokeAssigneeSessions(access);
    }

    return { settings: this.toSettingsView(row) };
  }

  /** Assignees lose password-less access: end their open mailbox sessions. */
  private async revokeAssigneeSessions(access: MailAppAccess) {
    const admins = await this.prisma.mailAppMember.findMany({
      where: {
        mailAppId: access.app.id,
        status: InvitationStatus.ACCEPTED,
        role: MailAppMemberRole.ADMIN,
      },
      select: { userId: true },
    });
    const privileged = new Set([access.app.userId, ...admins.map((a) => a.userId)]);
    const boxes = await this.prisma.mailMailbox.findMany({
      where: { mailAppId: access.app.id, assignedUserId: { not: null } },
      select: { id: true, assignedUserId: true },
    });
    for (const box of boxes) {
      if (box.assignedUserId && !privileged.has(box.assignedUserId)) {
        await this.mailboxSessions.revokeMailbox(box.id);
      }
    }
  }

  async overview(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    const roster = await this.members.list(userId, publicAppId);
    const canManage = this.access.canManageTeam(access);

    const [settings, mailboxes, links, idp] = await Promise.all([
      this.loadSettings(access.app.id),
      this.prisma.mailMailbox.findMany({
        where: { mailAppId: access.app.id, status: MailMailboxStatus.ACTIVE },
        select: {
          id: true,
          localPart: true,
          domain: true,
          displayName: true,
          assignedUserId: true,
          pendingAssigneeEmail: true,
        },
        orderBy: { localPart: 'asc' },
      }),
      canManage
        ? this.prisma.mailSsoAccessLink.findMany({
            where: { mailAppId: access.app.id },
            orderBy: { createdAt: 'desc' },
            take: 500,
          })
        : Promise.resolve([]),
      this.prisma.mailAppIdentityProvider.findUnique({
        where: { mailAppId: access.app.id },
        select: {
          id: true,
          preset: true,
          enabled: true,
          emailDomain: true,
          enforceSso: true,
          lastTestedAt: true,
          lastTestError: true,
        },
      }),
    ]);

    const latestLinkByEmail = new Map<string, (typeof links)[number]>();
    for (const link of links) {
      if (!latestLinkByEmail.has(link.email)) latestLinkByEmail.set(link.email, link);
    }

    const boxesFor = (userIdOrNull: string | null, email: string) =>
      mailboxes
        .filter(
          (box) =>
            (userIdOrNull && box.assignedUserId === userIdOrNull) ||
            box.pendingAssigneeEmail === email,
        )
        .map((box) => ({
          id: box.id,
          address: `${box.localPart}@${box.domain}`,
          pending: box.pendingAssigneeEmail === email && box.assignedUserId !== userIdOrNull,
        }));

    const linkFor = (email: string) => {
      const link = latestLinkByEmail.get(email);
      return link ? this.linkView(link) : null;
    };

    const people = [
      ...(roster.owner
        ? [
            {
              key: `owner:${roster.owner.id}`,
              kind: 'owner' as const,
              id: roster.owner.id,
              userId: roster.owner.id,
              email: this.normalizeEmail(roster.owner.email),
              name: roster.owner.name,
              role: 'OWNER' as const,
              status: 'ACCEPTED' as const,
              joinedAt: null as string | null,
              mailboxes: boxesFor(roster.owner.id, this.normalizeEmail(roster.owner.email)),
              link: null,
            },
          ]
        : []),
      ...roster.members.map((m) => {
        const email = this.normalizeEmail(m.user.email);
        return {
          key: `member:${m.id}`,
          kind: 'member' as const,
          id: m.id,
          userId: m.user.id,
          email,
          name: m.user.name,
          role: m.role,
          status: m.status,
          joinedAt: m.acceptedAt,
          mailboxes: boxesFor(m.user.id, email),
          link: linkFor(email),
        };
      }),
      ...(roster.emailInvites ?? []).map((invite) => {
        const email = this.normalizeEmail(invite.email);
        return {
          key: `invite:${invite.id}`,
          kind: 'email_invite' as const,
          id: invite.id,
          userId: null,
          email,
          name: null,
          role: invite.role,
          status: invite.status,
          joinedAt: null,
          mailboxes: boxesFor(null, email),
          link: linkFor(email),
        };
      }),
    ];

    return {
      canManage,
      isOwner: access.isOwner,
      consoleMembersIncluded: roster.consoleMembersIncluded,
      consoleMembersUsed: roster.consoleMembersUsed,
      settings,
      workspace: {
        appId: access.app.appId,
        name: access.app.name,
        primaryDomain: access.app.primaryDomain,
        domainActive: access.app.domainStatus === 'ACTIVE',
      },
      mailboxes: mailboxes.map((box) => ({
        id: box.id,
        address: `${box.localPart}@${box.domain}`,
        displayName: box.displayName,
        assignedUserId: box.assignedUserId,
        pendingAssigneeEmail: box.pendingAssigneeEmail,
      })),
      people,
      identityProvider: idp
        ? {
            ...idp,
            lastTestedAt: idp.lastTestedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Provisioning
  // ---------------------------------------------------------------------------

  async provision(userId: string, publicAppId: string, dto: ProvisionMailSsoDto) {
    const access = await this.requireManager(userId, publicAppId);
    const settings = await this.loadSettings(access.app.id);
    this.assertQuickLinksEnabled(settings);
    return this.provisionOne(userId, access, settings, dto);
  }

  async provisionBulk(
    userId: string,
    publicAppId: string,
    dto: ProvisionMailSsoBulkDto,
  ) {
    const access = await this.requireManager(userId, publicAppId);
    const settings = await this.loadSettings(access.app.id);
    this.assertQuickLinksEnabled(settings);

    const seen = new Set<string>();
    const results: {
      email: string;
      ok: boolean;
      error?: string;
      code?: string;
      result?: Awaited<ReturnType<MailSsoService['provisionOne']>>;
    }[] = [];

    for (const row of dto.rows) {
      const email = this.normalizeEmail(row.email);
      if (seen.has(email)) {
        results.push({ email, ok: false, error: 'Duplicate row for this email.' });
        continue;
      }
      seen.add(email);
      try {
        const result = await this.provisionOne(userId, access, settings, row);
        results.push({ email, ok: true, result });
      } catch (error) {
        const { message, code } = this.describeError(error);
        results.push({ email, ok: false, error: message, code });
      }
    }

    return {
      results,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    };
  }

  private describeError(error: unknown): { message: string; code?: string } {
    if (error instanceof HttpException) {
      const body = error.getResponse();
      if (typeof body === 'string') return { message: body };
      const obj = body as { message?: string | string[]; code?: string };
      const message = Array.isArray(obj.message) ? obj.message[0] : obj.message;
      return { message: message || error.message, code: obj.code };
    }
    this.logger.error('Bulk SSO provisioning row failed', error as Error);
    return { message: 'Unexpected error.' };
  }

  private async provisionOne(
    userId: string,
    access: MailAppAccess,
    settings: SsoSettingsView,
    dto: ProvisionMailSsoDto,
  ) {
    const email = this.normalizeEmail(dto.email);
    this.assertEmailDomainAllowed(email, settings);
    if (dto.mailboxId && dto.newLocalPart) {
      throw new BadRequestException('Pick an existing mailbox or a new address, not both.');
    }

    const invitee = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true },
    });
    if (invitee?.id === access.app.userId) {
      throw new BadRequestException('The workspace owner already has access.');
    }

    // 1. Membership: reuse an accepted/pending seat, otherwise invite without the generic email.
    let memberId: string | null = null;
    let emailInviteId: string | null = null;
    let accepted = false;

    const member = invitee
      ? await this.prisma.mailAppMember.findUnique({
          where: {
            mailAppId_userId: { mailAppId: access.app.id, userId: invitee.id },
          },
        })
      : null;
    const pendingEmailInvite = invitee
      ? null
      : await this.prisma.mailAppEmailInvite.findFirst({
          where: {
            mailAppId: access.app.id,
            email,
            status: InvitationStatus.PENDING,
            expiresAt: { gt: new Date() },
          },
        });

    if (member?.status === InvitationStatus.ACCEPTED) {
      memberId = member.id;
      accepted = true;
    } else if (
      member?.status === InvitationStatus.PENDING &&
      (!member.expiresAt || member.expiresAt.getTime() > Date.now())
    ) {
      memberId = member.id;
    } else if (pendingEmailInvite) {
      emailInviteId = pendingEmailInvite.id;
    } else {
      const invited = await this.members.invite(
        userId,
        access.app.appId,
        { email, role: dto.role },
        { sendEmail: false },
      );
      if (invited.kind === 'member') memberId = invited.member.id;
      else emailInviteId = invited.emailInvite.id;
    }

    // 2. Mailbox: existing seat or a new address with a random password (SSO is the way in).
    const mailbox = await this.resolveMailboxForProvision(userId, access, dto);
    if (mailbox) {
      await this.prisma.mailMailbox.update({
        where: { id: mailbox.id },
        data:
          accepted && invitee
            ? { assignedUserId: invitee.id, pendingAssigneeEmail: null }
            : { assignedUserId: null, pendingAssigneeEmail: email },
      });
      await this.mailboxSessions.revokeMailbox(mailbox.id);
    }

    // 3. One live link per teammate.
    await this.prisma.mailSsoAccessLink.updateMany({
      where: { mailAppId: access.app.id, email, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const token = newMailSsoToken();
    const expiresAt = new Date(Date.now() + settings.linkTtlHours * 60 * 60 * 1000);
    const link = await this.prisma.mailSsoAccessLink.create({
      data: {
        mailAppId: access.app.id,
        tokenHash: hashMailSsoToken(token),
        email,
        mailboxId: mailbox?.id ?? null,
        memberId,
        emailInviteId,
        createdBy: userId,
        expiresAt,
      },
    });

    const url = this.linkUrl(token);
    await this.sendLinkEmail({
      to: email,
      inviterId: userId,
      workspaceName: access.app.name,
      mailboxAddress: mailbox?.address ?? null,
      url,
      expiresAt,
    });

    return {
      email,
      kind: memberId ? ('member' as const) : ('email_invite' as const),
      needsSignup: !invitee,
      alreadyMember: accepted,
      mailbox: mailbox ? { id: mailbox.id, address: mailbox.address } : null,
      link: { ...this.linkView(link), url },
    };
  }

  private async resolveMailboxForProvision(
    userId: string,
    access: MailAppAccess,
    dto: ProvisionMailSsoDto,
  ): Promise<{ id: string; address: string } | null> {
    if (dto.mailboxId) {
      const box = await this.prisma.mailMailbox.findFirst({
        where: {
          id: dto.mailboxId,
          mailAppId: access.app.id,
          status: MailMailboxStatus.ACTIVE,
        },
        select: { id: true, localPart: true, domain: true },
      });
      if (!box) throw new NotFoundException('Mailbox not found.');
      return { id: box.id, address: `${box.localPart}@${box.domain}` };
    }
    if (dto.newLocalPart) {
      const created = await this.mailboxes.create(userId, access.app.appId, {
        localPart: dto.newLocalPart,
        password: randomBytes(24).toString('base64url'),
        displayName: dto.displayName,
      } as Parameters<MailMailboxesService['create']>[2]);
      return { id: created.mailbox.id, address: created.mailbox.address };
    }
    return null;
  }

  private async sendLinkEmail(opts: {
    to: string;
    inviterId: string;
    workspaceName: string;
    mailboxAddress: string | null;
    url: string;
    expiresAt: Date;
  }) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: opts.inviterId },
      select: { email: true, profile: { select: { name: true, username: true } } },
    });
    const inviterName =
      inviter?.profile?.name || inviter?.profile?.username || inviter?.email || 'A teammate';
    await this.email.sendMailSsoAccessLink(opts.to, {
      inviterName,
      workspaceName: opts.workspaceName,
      mailboxAddress: opts.mailboxAddress,
      url: opts.url,
      expiresAt: opts.expiresAt,
    });
  }

  // ---------------------------------------------------------------------------
  // Link lifecycle
  // ---------------------------------------------------------------------------

  async resendLink(
    userId: string,
    publicAppId: string,
    linkId: string,
    dto: ResendMailSsoLinkDto,
  ) {
    const access = await this.requireManager(userId, publicAppId);
    const settings = await this.loadSettings(access.app.id);
    this.assertQuickLinksEnabled(settings);

    const link = await this.prisma.mailSsoAccessLink.findFirst({
      where: { id: linkId, mailAppId: access.app.id },
      include: { mailbox: { select: { localPart: true, domain: true } } },
    });
    if (!link) throw new NotFoundException('Link not found.');
    if (link.usedAt) {
      throw new BadRequestException('This teammate already used their link.');
    }
    const deliver = dto.deliver !== false;
    if (deliver && Date.now() - link.lastSentAt.getTime() < LINK_RESEND_COOLDOWN_MS) {
      throw new BadRequestException('Please wait a minute before resending this link.');
    }
    if (!(await this.hasLiveSeat(access.app.id, link.email))) {
      throw new BadRequestException(
        'This invite was cancelled or expired. Add the teammate again.',
      );
    }

    // Raw tokens are never stored, so a resend always rotates the token.
    const token = newMailSsoToken();
    const expiresAt = new Date(Date.now() + settings.linkTtlHours * 60 * 60 * 1000);
    const updated = await this.prisma.mailSsoAccessLink.update({
      where: { id: link.id },
      data: {
        tokenHash: hashMailSsoToken(token),
        expiresAt,
        revokedAt: null,
        ...(deliver ? { lastSentAt: new Date() } : {}),
      },
    });
    const url = this.linkUrl(token);
    if (deliver) {
      await this.sendLinkEmail({
        to: link.email,
        inviterId: userId,
        workspaceName: access.app.name,
        mailboxAddress: link.mailbox ? `${link.mailbox.localPart}@${link.mailbox.domain}` : null,
        url,
        expiresAt,
      });
    }
    return { link: { ...this.linkView(updated), url }, delivered: deliver };
  }

  private async hasLiveSeat(mailAppId: string, email: string) {
    const user = await this.prisma.user.findFirst({ where: { email }, select: { id: true } });
    if (user) {
      const member = await this.prisma.mailAppMember.findUnique({
        where: { mailAppId_userId: { mailAppId, userId: user.id } },
        select: { status: true },
      });
      if (
        member?.status === InvitationStatus.ACCEPTED ||
        member?.status === InvitationStatus.PENDING
      ) {
        return true;
      }
    }
    const invite = await this.prisma.mailAppEmailInvite.findFirst({
      where: {
        mailAppId,
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return Boolean(invite);
  }

  async revokeLink(userId: string, publicAppId: string, linkId: string) {
    const access = await this.requireManager(userId, publicAppId);
    const link = await this.prisma.mailSsoAccessLink.findFirst({
      where: { id: linkId, mailAppId: access.app.id },
    });
    if (!link) throw new NotFoundException('Link not found.');
    if (link.usedAt) {
      throw new BadRequestException('Used links cannot be revoked.');
    }
    const updated = await this.prisma.mailSsoAccessLink.update({
      where: { id: link.id },
      data: { revokedAt: link.revokedAt ?? new Date() },
    });
    return { link: this.linkView(updated) };
  }

  // ---------------------------------------------------------------------------
  // Public preview + consume
  // ---------------------------------------------------------------------------

  private async findUsableLink(token: string) {
    if (!isWellFormedMailSsoToken(token)) {
      throw new NotFoundException('This sign-in link is not valid.');
    }
    const link = await this.prisma.mailSsoAccessLink.findUnique({
      where: { tokenHash: hashMailSsoToken(token) },
      include: {
        mailApp: true,
        mailbox: {
          select: { id: true, localPart: true, domain: true, status: true },
        },
      },
    });
    if (!link || link.mailApp.status !== MailAppStatus.ACTIVE) {
      throw new NotFoundException('This sign-in link is not valid.');
    }
    const status = mailSsoLinkStatus(link);
    if (status !== 'sent') {
      throw new BadRequestException({
        statusCode: 400,
        code: `MAIL_SSO_LINK_${status.toUpperCase()}`,
        message:
          status === 'used'
            ? 'This sign-in link was already used. Open Rukny Mail and sign in normally.'
            : status === 'expired'
              ? 'This sign-in link has expired. Ask your admin to send a new one.'
              : 'This sign-in link was revoked. Ask your admin to send a new one.',
      });
    }
    const settings = await this.loadSettings(link.mailAppId);
    this.assertQuickLinksEnabled(settings);
    return { link, settings };
  }

  async previewLink(token: string) {
    const { link, settings } = await this.findUsableLink(token);
    return {
      email: link.email,
      expiresAt: link.expiresAt.toISOString(),
      autoAccept: settings.autoAcceptOnLink,
      workspace: {
        appId: link.mailApp.appId,
        name: link.mailApp.name,
        primaryDomain: link.mailApp.primaryDomain,
      },
      mailbox: link.mailbox
        ? { address: `${link.mailbox.localPart}@${link.mailbox.domain}` }
        : null,
    };
  }

  async consumeLink(
    userId: string,
    token: string,
    dto: ConsumeMailSsoLinkDto,
  ): Promise<MailSsoConsumeResult> {
    const { link, settings } = await this.findUsableLink(token);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    if (this.normalizeEmail(user.email) !== link.email) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_SSO_EMAIL_MISMATCH',
        message: `This link is for ${link.email}. Sign in with that email to continue.`,
      });
    }

    const app = link.mailApp;
    const member = await this.prisma.mailAppMember.findUnique({
      where: { mailAppId_userId: { mailAppId: app.id, userId } },
    });
    const isOwner = app.userId === userId;
    const alreadyIn = isOwner || member?.status === InvitationStatus.ACCEPTED;

    if (!alreadyIn && !settings.autoAcceptOnLink && !dto.confirm) {
      return {
        needsConfirmation: true,
        workspace: { appId: app.appId, name: app.name },
      };
    }

    // Single use: claim the link atomically before any side effects.
    const claimed = await this.prisma.mailSsoAccessLink.updateMany({
      where: { id: link.id, usedAt: null, revokedAt: null },
      data: { usedAt: new Date(), usedByUserId: userId },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'MAIL_SSO_LINK_USED',
        message: 'This sign-in link was already used.',
      });
    }

    let slotIndex: number;
    try {
      slotIndex = await this.joinWorkspace(userId, link.email, app, member);
    } catch (error) {
      await this.prisma.mailSsoAccessLink.update({
        where: { id: link.id },
        data: { usedAt: null, usedByUserId: null },
      });
      throw error;
    }

    // Every seat reserved for this email becomes the user's.
    await this.prisma.mailMailbox.updateMany({
      where: { mailAppId: app.id, pendingAssigneeEmail: link.email },
      data: { assignedUserId: userId, pendingAssigneeEmail: null },
    });

    let mailbox: { id: string; address: string } | null = null;
    let mailboxSessionToken: string | null = null;
    if (link.mailboxId) {
      const box = await this.prisma.mailMailbox.findFirst({
        where: { id: link.mailboxId, mailAppId: app.id },
        select: { id: true, localPart: true, domain: true, status: true, assignedUserId: true },
      });
      if (box && box.status === MailMailboxStatus.ACTIVE && box.assignedUserId === userId) {
        mailbox = { id: box.id, address: `${box.localPart}@${box.domain}` };
        if (settings.skipMailboxPasswordForAssigned || isOwner) {
          mailboxSessionToken = await this.mailboxSessions.create({
            userId,
            appId: app.appId,
            mailboxId: box.id,
            address: mailbox.address,
          });
        }
      }
    }

    this.logger.log(
      `Quick sign-in link used: app=${app.appId} user=${userId} mailbox=${mailbox?.id ?? '-'}`,
    );

    return {
      needsConfirmation: false,
      workspace: { appId: app.appId, name: app.name, slotIndex },
      mailbox,
      mailboxSessionToken,
    };
  }

  /** Accept the pending seat (member row or email invite). Returns the user's /uN slot. */
  private async joinWorkspace(
    userId: string,
    email: string,
    app: { id: string; userId: string; slotIndex: number },
    member: { id: string; status: InvitationStatus; slotIndex: number | null } | null,
  ): Promise<number> {
    if (app.userId === userId) return app.slotIndex;
    if (member?.status === InvitationStatus.ACCEPTED) {
      return member.slotIndex ?? 0;
    }
    if (member?.status === InvitationStatus.PENDING) {
      const accepted = await this.members.acceptInvitation(userId, member.id);
      return accepted.workspace.slotIndex;
    }
    const invite = await this.prisma.mailAppEmailInvite.findFirst({
      where: { mailAppId: app.id, email, status: InvitationStatus.PENDING },
      select: { token: true },
    });
    if (!invite) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'MAIL_SSO_INVITE_GONE',
        message: 'Your invitation was cancelled or expired. Ask your admin to add you again.',
      });
    }
    const claimed = await this.members.claimEmailInvite(userId, invite.token);
    return claimed.workspace.slotIndex;
  }
}
