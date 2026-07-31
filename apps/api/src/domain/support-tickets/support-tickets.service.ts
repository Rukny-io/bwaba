import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  Prisma,
  SupportTicketStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  type SupportTicket,
  type SupportTicketMessage,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { OwnableService } from '../../core/common/services/ownable.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { SupportTicketsGateway } from './support-tickets.gateway';
import { EmailService } from '../../integrations/email/email.service';
import { StorageService } from '../storage/storage.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { AdminListTicketsQueryDto } from './dto/admin-support-tickets.dto';
import {
  AssignTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket-status.dto';
import { listCannedResponses } from './support-canned-responses.constants';
import {
  buildSupportTicketEmailHtml,
  buildSupportTicketUrl,
  getCreatedCopy,
  getReplyCopy,
  getStatusNotificationCopy,
  pickLocale,
} from './support-ticket-notifications.helper';

const MAX_OPEN_TICKETS = 10;
const MAX_TICKETS_PER_HOUR = 5;
const MAX_ATTACHMENTS_PER_SCOPE = 3;
const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const ALLOWED_CONTEXT_KEYS = new Set([
  'page',
  'plan',
  'locale',
  'twoFactorEnabled',
  'userAgent',
  'referrer',
]);

const USER_REPLYABLE_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.IN_PROGRESS,
  SupportTicketStatus.WAITING_ON_USER,
];

@Injectable()
export class SupportTicketsService extends OwnableService {
  private readonly logger = new Logger(SupportTicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly supportTicketsGateway: SupportTicketsGateway,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async createTicket(userId: string, dto: CreateTicketDto) {
    await this.assertTicketCreationAllowed(userId);

    const number = await this.generateTicketNumber();
    const sanitizedContext = this.sanitizeContext(dto.context);
    const subject = this.sanitizeText(dto.subject);
    const description = this.sanitizeText(dto.description);

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          id: randomUUID(),
          number,
          userId,
          subject,
          description,
          category: dto.category,
          ...(sanitizedContext
            ? { context: sanitizedContext as Prisma.InputJsonValue }
            : {}),
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          id: randomUUID(),
          ticketId: created.id,
          authorId: userId,
          body: description,
          isStaff: false,
        },
      });

      return created;
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const locale = pickLocale(sanitizedContext);
    const createdCopy = getCreatedCopy(locale, ticket.number);

    await this.deliverUserTicketUpdate({
      userId,
      userEmail: user?.email,
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      ticketSubject: ticket.subject,
      type: NotificationType.SUPPORT_TICKET_CREATED,
      title: createdCopy.title,
      message: createdCopy.message,
      emailSubject: createdCopy.emailSubject,
      emailHeadline: createdCopy.emailHeadline,
      emailBody: createdCopy.emailBody,
      ctaLabel: createdCopy.ctaLabel,
      data: { ticketId: ticket.id, ticketNumber: ticket.number },
    });

    this.notifySupportTeamNewTicket(ticket).catch((err) =>
      this.logger.warn(`Support team notify failed: ${err.message}`),
    );

    return this.toTicketSummary(ticket);
  }

  /**
   * تذكرة تلقائية عند محاولة ربط رقم هاتف مرتبط بحساب آخر (استعادة ملكية).
   * تتجاوز حدود إنشاء التذاكر اليدوية — النظام يفتحها مرة واحدة لكل محاولة.
   */
  async createPhoneClaimDisputeTicket(
    requestingUserId: string,
    phone: string,
    existingOwnerUserId: string,
  ): Promise<{ id: string; number: string }> {
    const maskedPhone = this.maskPhoneForTicket(phone);
    const number = await this.generateTicketNumber();

    const [requestingUser, existingOwner] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { email: true },
      }),
      this.prisma.user.findUnique({
        where: { id: existingOwnerUserId },
        select: { email: true },
      }),
    ]);

    const subject = `طلب التحقق من ملكية رقم هاتف ${maskedPhone}`;
    const description = `حاولت إضافة رقم الهاتف ${maskedPhone} إلى حسابي، لكن الرقم مرتبط بحساب آخر.

أؤكد أن هذا الرقم يخصني وأطلب المساعدة في التحقق من ملكيته واستعادة الوصول إن لزم الأمر.

سيتواصل معك فريق الدعم بعد مراجعة الطلب وقد يُطلب إثبات هوية.`;

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          id: randomUUID(),
          number,
          userId: requestingUserId,
          subject,
          description,
          category: SupportTicketCategory.ACCOUNT,
          priority: SupportTicketPriority.HIGH,
          context: {
            page: 'personal-info',
            locale: 'ar',
          } as Prisma.InputJsonValue,
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          id: randomUUID(),
          ticketId: created.id,
          authorId: requestingUserId,
          body: description,
          isStaff: false,
        },
      });

      await tx.supportTicketMessage.create({
        data: {
          id: randomUUID(),
          ticketId: created.id,
          authorId: requestingUserId,
          body: `[نظام — داخلي] نزاع ملكية رقم هاتف
الرقم الكامل: ${phone}
طالب الملكية: ${requestingUserId} (${requestingUser?.email ?? 'بدون بريد'})
الحساب المرتبط حالياً: ${existingOwnerUserId} (${existingOwner?.email ?? 'بدون بريد'})`,
          isStaff: true,
          isInternal: true,
        },
      });

      return created;
    });

    const createdCopy = getCreatedCopy('ar', ticket.number);
    await this.deliverUserTicketUpdate({
      userId: requestingUserId,
      userEmail: requestingUser?.email,
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      ticketSubject: ticket.subject,
      type: NotificationType.SUPPORT_TICKET_CREATED,
      title: createdCopy.title,
      message: createdCopy.message,
      emailSubject: createdCopy.emailSubject,
      emailHeadline: createdCopy.emailHeadline,
      emailBody: createdCopy.emailBody,
      ctaLabel: createdCopy.ctaLabel,
      data: { ticketId: ticket.id, ticketNumber: ticket.number },
    });

    this.notifySupportTeamNewTicket(ticket).catch((err) =>
      this.logger.warn(`Support team notify failed: ${err.message}`),
    );

    this.logger.log(
      `Phone claim dispute ticket ${ticket.number} for user ${requestingUserId}`,
    );

    return { id: ticket.id, number: ticket.number };
  }

  private maskPhoneForTicket(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) return '***';
    return `+${digits.slice(0, 3)}***${digits.slice(-3)}`;
  }

  async listUserTickets(userId: string, query: ListTicketsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const skip = (page - 1) * limit;

    const where = this.scopedWhere(
      { userId },
      query.status ? { status: query.status } : {},
    );

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets: tickets.map((ticket) => this.toTicketSummary(ticket)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getUserTicket(userId: string, ticketId: string) {
    const ticket = await this.assertOwned(
      this.prisma.supportTicket,
      ticketId,
      { userId },
      'Support ticket',
    );

    const messages = await this.prisma.supportTicketMessage.findMany({
      where: { ticketId, isInternal: false },
      orderBy: { createdAt: 'asc' },
    });

    const attachments = await this.loadTicketAttachments(ticketId);

    return {
      ...this.toTicketSummary(ticket),
      messages: messages.map((message) =>
        this.toMessageDto(
          message,
          attachments.filter((item) => item.messageId === message.id),
        ),
      ),
      attachments: attachments.filter((item) => !item.messageId),
    };
  }

  async addUserMessage(
    userId: string,
    ticketId: string,
    dto: CreateMessageDto,
  ) {
    const ticket = await this.assertOwned(
      this.prisma.supportTicket,
      ticketId,
      { userId },
      'Support ticket',
    );

    this.assertUserCanReply(ticket);

    const body = this.sanitizeText(dto.body);
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicketMessage.create({
        data: {
          id: randomUUID(),
          ticketId,
          authorId: userId,
          body,
          isStaff: false,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status:
            ticket.status === SupportTicketStatus.WAITING_ON_USER
              ? SupportTicketStatus.IN_PROGRESS
              : ticket.status,
          updatedAt: new Date(),
        },
      });

      return created;
    });

    this.notifySupportTeamUserReply(ticket, body).catch((err) =>
      this.logger.warn(`Support team user-reply notify failed: ${err.message}`),
    );

    const messageDto = this.toMessageDto(message);
    this.supportTicketsGateway.emitPublicMessage(ticketId, messageDto);
    this.supportTicketsGateway.emitStaffActivity({
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      subject: ticket.subject,
      preview: body.slice(0, 120),
    });

    const nextStatus =
      ticket.status === SupportTicketStatus.WAITING_ON_USER
        ? SupportTicketStatus.IN_PROGRESS
        : ticket.status;
    if (nextStatus !== ticket.status) {
      this.supportTicketsGateway.emitTicketUpdated(ticketId, ticket.userId, {
        ticketId,
        status: nextStatus,
        updatedAt: new Date(),
      });
    }

    return messageDto;
  }

  async closeTicket(userId: string, ticketId: string) {
    const ticket = await this.assertOwned(
      this.prisma.supportTicket,
      ticketId,
      { userId },
      'Support ticket',
    );

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return this.toTicketSummary(ticket);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: SupportTicketStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const locale = pickLocale(ticket.context);
    const statusCopy = getStatusNotificationCopy(
      SupportTicketStatus.CLOSED,
      locale,
    );

    await this.deliverUserTicketUpdate({
      userId,
      userEmail: user?.email,
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      ticketSubject: ticket.subject,
      type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
      title: statusCopy.title,
      message: `${statusCopy.message} (${ticket.number})`,
      emailSubject: `${statusCopy.emailHeadline} — ${ticket.number}`,
      emailHeadline: statusCopy.emailHeadline,
      emailBody: statusCopy.emailBody,
      ctaLabel: locale === 'en' ? 'View ticket' : 'عرض التذكرة',
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        status: SupportTicketStatus.CLOSED,
      },
    });

    this.supportTicketsGateway.emitTicketUpdated(ticketId, userId, {
      ticketId,
      status: SupportTicketStatus.CLOSED,
      updatedAt: updated.updatedAt,
      closedAt: updated.closedAt,
    });

    return this.toTicketSummary(updated);
  }

  async reopenTicket(userId: string, ticketId: string) {
    const ticket = await this.assertOwned(
      this.prisma.supportTicket,
      ticketId,
      { userId },
      'Support ticket',
    );

    if (ticket.status !== SupportTicketStatus.CLOSED) {
      throw new BadRequestException('Only closed tickets can be reopened');
    }

    if (
      !ticket.closedAt ||
      Date.now() - ticket.closedAt.getTime() > REOPEN_WINDOW_MS
    ) {
      throw new BadRequestException(
        'This ticket can no longer be reopened. Please open a new ticket.',
      );
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: SupportTicketStatus.OPEN,
        closedAt: null,
      },
    });

    this.supportTicketsGateway.emitTicketUpdated(ticketId, userId, {
      ticketId,
      status: SupportTicketStatus.OPEN,
      updatedAt: updated.updatedAt,
      closedAt: null,
    });

    return this.toTicketSummary(updated);
  }

  async getOpenTicketCount(userId: string) {
    const count = await this.prisma.supportTicket.count({
      where: {
        userId,
        status: {
          notIn: [
            SupportTicketStatus.CLOSED,
            SupportTicketStatus.RESOLVED,
          ],
        },
      },
    });
    return { openCount: count };
  }

  // ── Admin ───────────────────────────────────────────────────────────

  async listAllTickets(query: AdminListTicketsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assignedTo === 'unassigned'
        ? { assignedTo: null }
        : query.assignedTo
          ? { assignedTo: query.assignedTo }
          : {}),
      ...(query.search
        ? {
            OR: [
              { subject: { contains: query.search, mode: 'insensitive' } },
              { number: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  email: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true } },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets: tickets.map((ticket) => ({
        ...this.toTicketSummary(ticket),
        userId: ticket.user.id,
        userEmail: ticket.user.email,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getAdminTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const attachments = await this.loadTicketAttachments(ticketId);

    return {
      ...this.toTicketSummary(ticket),
      userId: ticket.user.id,
      userEmail: ticket.user.email,
      description: ticket.description,
      context: ticket.context,
      messages: ticket.messages.map((message) =>
        this.toMessageDto(
          message,
          attachments.filter((item) => item.messageId === message.id),
          true,
        ),
      ),
      attachments: attachments.filter((item) => !item.messageId),
    };
  }

  async getCannedResponses(locale?: 'en' | 'ar') {
    return { responses: listCannedResponses(locale) };
  }

  async getAdminStats() {
    const activeStatuses: SupportTicketStatus[] = [
      SupportTicketStatus.OPEN,
      SupportTicketStatus.IN_PROGRESS,
      SupportTicketStatus.WAITING_ON_USER,
    ];

    const [open, inProgress, waitingOnUser, urgent, unassigned, totalActive] =
      await Promise.all([
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.OPEN },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.IN_PROGRESS },
        }),
        this.prisma.supportTicket.count({
          where: { status: SupportTicketStatus.WAITING_ON_USER },
        }),
        this.prisma.supportTicket.count({
          where: {
            status: { in: activeStatuses },
            priority: 'URGENT',
          },
        }),
        this.prisma.supportTicket.count({
          where: {
            status: { in: activeStatuses },
            assignedTo: null,
          },
        }),
        this.prisma.supportTicket.count({
          where: { status: { in: activeStatuses } },
        }),
      ]);

    return {
      open,
      inProgress,
      waitingOnUser,
      urgent,
      unassigned,
      totalActive,
    };
  }

  async addInternalNote(adminId: string, ticketId: string, body: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        id: randomUUID(),
        ticketId,
        authorId: adminId,
        body: this.sanitizeText(body),
        isStaff: true,
        isInternal: true,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    const messageDto = this.toMessageDto(message, [], true);
    this.supportTicketsGateway.emitInternalMessage(ticketId, messageDto);

    return messageDto;
  }

  async uploadAttachment(
    actorId: string,
    ticketId: string,
    file: Express.Multer.File,
    options?: { messageId?: string; isAdmin?: boolean },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (!options?.isAdmin && ticket.userId !== actorId) {
      throw new NotFoundException('Support ticket not found');
    }

    if (options?.messageId) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          options.messageId,
        )
      ) {
        throw new BadRequestException('Invalid message id');
      }
      const message = await this.prisma.supportTicketMessage.findFirst({
        where: {
          id: options.messageId,
          ticketId,
          ...(options.isAdmin ? {} : { isInternal: false }),
        },
      });
      if (!message) {
        throw new BadRequestException('Message not found on this ticket');
      }
    }

    const scopeWhere = {
      ticketId,
      messageId: options?.messageId ?? null,
    };
    const existingCount = await this.prisma.supportTicketAttachment.count({
      where: scopeWhere,
    });
    if (existingCount >= MAX_ATTACHMENTS_PER_SCOPE) {
      throw new BadRequestException('Maximum attachments reached');
    }

    const uploaded = await this.storageService.uploadSupportAttachment(
      actorId,
      ticketId,
      file,
      ticket.userId,
    );

    const attachment = await this.prisma.supportTicketAttachment.create({
      data: {
        id: randomUUID(),
        ticketId,
        messageId: options?.messageId ?? null,
        fileId: uploaded.id,
        uploadedById: actorId,
      },
      include: {
        file: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            key: true,
          },
        },
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return this.toAttachmentDto(attachment);
  }

  async updateTicketStatus(
    ticketId: string,
    dto: UpdateTicketStatusDto,
    adminId: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    this.assertValidStatusTransition(ticket.status, dto.status);

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status,
        priority: dto.priority ?? ticket.priority,
        closedAt:
          dto.status === SupportTicketStatus.CLOSED ||
          dto.status === SupportTicketStatus.RESOLVED
            ? new Date()
            : dto.status === SupportTicketStatus.OPEN ||
                dto.status === SupportTicketStatus.IN_PROGRESS ||
                dto.status === SupportTicketStatus.WAITING_ON_USER
              ? null
              : ticket.closedAt,
      },
    });

    if (ticket.status !== dto.status) {
      const locale = pickLocale(ticket.context);
      const statusCopy = getStatusNotificationCopy(dto.status, locale);

      await this.deliverUserTicketUpdate({
        userId: ticket.userId,
        userEmail: ticket.user.email,
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        ticketSubject: ticket.subject,
        type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
        title: statusCopy.title,
        message: `${statusCopy.message} (${ticket.number})`,
        emailSubject: `${statusCopy.emailHeadline} — ${ticket.number}`,
        emailHeadline: statusCopy.emailHeadline,
        emailBody: statusCopy.emailBody,
        ctaLabel: locale === 'en' ? 'View ticket' : 'عرض التذكرة',
        data: {
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          status: dto.status,
          updatedBy: adminId,
        },
      });
    }

    this.supportTicketsGateway.emitTicketUpdated(ticketId, ticket.userId, {
      ticketId,
      status: updated.status,
      priority: updated.priority,
      updatedAt: updated.updatedAt,
      closedAt: updated.closedAt,
    });

    return this.toTicketSummary(updated);
  }

  async startTicketWork(adminId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (
      ticket.status === SupportTicketStatus.CLOSED ||
      ticket.status === SupportTicketStatus.RESOLVED
    ) {
      throw new BadRequestException('Cannot start work on a closed ticket');
    }

    const nextStatus =
      ticket.status === SupportTicketStatus.WAITING_ON_USER
        ? SupportTicketStatus.IN_PROGRESS
        : ticket.status === SupportTicketStatus.OPEN
          ? SupportTicketStatus.IN_PROGRESS
          : ticket.status;

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        assignedTo: ticket.assignedTo ?? adminId,
      },
    });

    if (ticket.status !== SupportTicketStatus.IN_PROGRESS) {
      const locale = pickLocale(ticket.context);
      const statusCopy = getStatusNotificationCopy(
        SupportTicketStatus.IN_PROGRESS,
        locale,
      );

      await this.deliverUserTicketUpdate({
        userId: ticket.userId,
        userEmail: ticket.user.email,
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        ticketSubject: ticket.subject,
        type: NotificationType.SUPPORT_TICKET_STATUS_CHANGED,
        title: statusCopy.title,
        message: `${statusCopy.message} (${ticket.number})`,
        emailSubject: `${statusCopy.emailHeadline} — ${ticket.number}`,
        emailHeadline: statusCopy.emailHeadline,
        emailBody: statusCopy.emailBody,
        ctaLabel: locale === 'en' ? 'View ticket' : 'عرض التذكرة',
        data: {
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          status: SupportTicketStatus.IN_PROGRESS,
          startedBy: adminId,
        },
      });
    }

    this.supportTicketsGateway.emitTicketUpdated(ticketId, ticket.userId, {
      ticketId,
      status: updated.status,
      assignedTo: updated.assignedTo,
      updatedAt: updated.updatedAt,
    });

    return this.toTicketSummary(updated);
  }

  async assignTicket(ticketId: string, dto: AssignTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (dto.assignedTo) {
      const admin = await this.prisma.user.findFirst({
        where: { id: dto.assignedTo, role: 'ADMIN' },
        select: { id: true },
      });
      if (!admin) {
        throw new BadRequestException('Assigned user must be an admin');
      }
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo: dto.assignedTo ?? null },
    });

    this.supportTicketsGateway.emitTicketUpdated(ticketId, ticket.userId, {
      ticketId,
      assignedTo: updated.assignedTo,
      updatedAt: updated.updatedAt,
    });

    return this.toTicketSummary(updated);
  }

  async addStaffReply(
    adminId: string,
    ticketId: string,
    dto: CreateMessageDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { email: true } } },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    if (
      ticket.status === SupportTicketStatus.CLOSED ||
      ticket.status === SupportTicketStatus.RESOLVED
    ) {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    const body = this.sanitizeText(dto.body);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicketMessage.create({
        data: {
          id: randomUUID(),
          ticketId,
          authorId: adminId,
          body,
          isStaff: true,
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: SupportTicketStatus.WAITING_ON_USER,
          assignedTo: ticket.assignedTo ?? adminId,
          updatedAt: new Date(),
        },
      });

      return created;
    });

    const locale = pickLocale(ticket.context);
    const replyCopy = getReplyCopy(locale, ticket.number);

    await this.deliverUserTicketUpdate({
      userId: ticket.userId,
      userEmail: ticket.user.email,
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      ticketSubject: ticket.subject,
      type: NotificationType.SUPPORT_TICKET_REPLY,
      title: replyCopy.title,
      message: replyCopy.message,
      emailSubject: replyCopy.emailSubject,
      emailHeadline: replyCopy.emailHeadline,
      emailBody: replyCopy.emailBody,
      ctaLabel: replyCopy.ctaLabel,
      data: {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
      },
    });

    const messageDto = this.toMessageDto(message);
    this.supportTicketsGateway.emitPublicMessage(ticketId, messageDto);
    this.supportTicketsGateway.emitTicketUpdated(ticketId, ticket.userId, {
      ticketId,
      status: SupportTicketStatus.WAITING_ON_USER,
      assignedTo: ticket.assignedTo ?? adminId,
      updatedAt: new Date(),
    });

    return messageDto;
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private async assertTicketCreationAllowed(userId: string) {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [openCount, recentCount] = await Promise.all([
      this.prisma.supportTicket.count({
        where: {
          userId,
          status: {
            notIn: [
              SupportTicketStatus.CLOSED,
              SupportTicketStatus.RESOLVED,
            ],
          },
        },
      }),
      this.prisma.supportTicket.count({
        where: { userId, createdAt: { gte: hourAgo } },
      }),
    ]);

    if (openCount >= MAX_OPEN_TICKETS) {
      throw new HttpException(
        'You have too many open support tickets. Please close an existing ticket first.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (recentCount >= MAX_TICKETS_PER_HOUR) {
      throw new HttpException(
        'Too many tickets created recently. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private assertUserCanReply(ticket: SupportTicket) {
    if (!USER_REPLYABLE_STATUSES.includes(ticket.status)) {
      throw new BadRequestException(
        'This ticket is closed and cannot receive new messages',
      );
    }
  }

  private assertValidStatusTransition(
    current: SupportTicketStatus,
    next: SupportTicketStatus,
  ) {
    if (current === next) return;

    const allowed: Record<SupportTicketStatus, SupportTicketStatus[]> = {
      [SupportTicketStatus.OPEN]: [
        SupportTicketStatus.IN_PROGRESS,
        SupportTicketStatus.WAITING_ON_USER,
        SupportTicketStatus.RESOLVED,
        SupportTicketStatus.CLOSED,
      ],
      [SupportTicketStatus.IN_PROGRESS]: [
        SupportTicketStatus.WAITING_ON_USER,
        SupportTicketStatus.RESOLVED,
        SupportTicketStatus.CLOSED,
      ],
      [SupportTicketStatus.WAITING_ON_USER]: [
        SupportTicketStatus.IN_PROGRESS,
        SupportTicketStatus.RESOLVED,
        SupportTicketStatus.CLOSED,
      ],
      [SupportTicketStatus.RESOLVED]: [
        SupportTicketStatus.CLOSED,
        SupportTicketStatus.OPEN,
      ],
      [SupportTicketStatus.CLOSED]: [SupportTicketStatus.OPEN],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition ticket from ${current} to ${next}`,
      );
    }
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.supportTicket.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      });

      return `SUP-${year}-${String(count + 1).padStart(5, '0')}`;
    });
  }

  private sanitizeText(value: string): string {
    return value
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }

  private sanitizeContext(
    context?: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!context || typeof context !== 'object') return null;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      if (!ALLOWED_CONTEXT_KEYS.has(key)) continue;
      if (typeof value === 'string') {
        sanitized[key] = value.slice(0, 500);
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        sanitized[key] = value;
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : null;
  }

  private toTicketSummary(ticket: SupportTicket & { _count?: { messages: number } }) {
    return {
      id: ticket.id,
      number: ticket.number,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      closedAt: ticket.closedAt,
      messageCount: ticket._count?.messages,
    };
  }

  private toMessageDto(
    message: SupportTicketMessage,
    attachments: Array<{
      id: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
    }> = [],
    includeInternal = false,
  ) {
    return {
      id: message.id,
      ticketId: message.ticketId,
      authorId: message.authorId,
      body: message.body,
      isStaff: message.isStaff,
      ...(includeInternal ? { isInternal: message.isInternal } : {}),
      createdAt: message.createdAt,
      attachments,
    };
  }

  private async loadTicketAttachments(ticketId: string) {
    const rows = await this.prisma.supportTicketAttachment.findMany({
      where: { ticketId },
      include: {
        file: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            key: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      rows.map(async (row) => this.toAttachmentDto(row)),
    );
  }

  private async toAttachmentDto(row: {
    id: string;
    ticketId: string;
    messageId: string | null;
    uploadedById: string;
    createdAt: Date;
    file: {
      id: string;
      fileName: string;
      fileType: string;
      fileSize: bigint;
      key: string;
    };
  }) {
    const url = `/api/media/${row.file.key}`;
    return {
      id: row.id,
      ticketId: row.ticketId,
      messageId: row.messageId,
      uploadedById: row.uploadedById,
      fileName: row.file.fileName,
      fileType: row.file.fileType,
      fileSize: Number(row.file.fileSize),
      url,
      createdAt: row.createdAt,
    };
  }

  private async deliverUserTicketUpdate(params: {
    userId: string;
    userEmail?: string | null;
    ticketId: string;
    ticketNumber: string;
    ticketSubject: string;
    type: NotificationType;
    title: string;
    message: string;
    emailSubject: string;
    emailHeadline: string;
    emailBody: string;
    ctaLabel: string;
    data?: Record<string, unknown>;
  }) {
    await this.notificationsGateway.sendNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
    });

    if (!params.userEmail) return;

    const ticketUrl = buildSupportTicketUrl(
      this.configService,
      params.ticketId,
    );

    this.emailService
      .sendEmail({
        to: params.userEmail,
        subject: params.emailSubject,
        html: buildSupportTicketEmailHtml({
          ticketNumber: params.ticketNumber,
          subject: params.ticketSubject,
          headline: params.emailHeadline,
          body: params.emailBody,
          ctaLabel: params.ctaLabel,
          ticketUrl,
          preview: params.message,
        }),
      })
      .catch((err) =>
        this.logger.warn(
          `Support ticket email failed for ${params.ticketNumber}: ${err.message}`,
        ),
      );
  }

  private async notifySupportTeamNewTicket(ticket: SupportTicket) {
    const supportEmail =
      process.env.SUPPORT_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!supportEmail) return;

    const hqUrl =
      this.configService.get<string>('HQ_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3002';
    const ticketAdminUrl = `${hqUrl.replace(/\/$/, '')}/app/support-tickets/${ticket.id}`;

    await this.emailService.sendEmail({
      to: supportEmail,
      subject: `تذكرة دعم جديدة: ${ticket.number}`,
      html: buildSupportTicketEmailHtml({
        ticketNumber: ticket.number,
        subject: ticket.subject,
        headline: 'تذكرة دعم جديدة',
        body: 'تم فتح تذكرة دعم جديدة وتحتاج إلى مراجعة.',
        ctaLabel: 'فتح في HQ',
        ticketUrl: ticketAdminUrl,
        preview: ticket.subject,
      }),
    });
  }

  private async notifySupportTeamUserReply(
    ticket: SupportTicket,
    replyBody: string,
  ) {
    const supportEmail =
      process.env.SUPPORT_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (!supportEmail) return;

    const hqUrl =
      this.configService.get<string>('HQ_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3002';
    const ticketAdminUrl = `${hqUrl.replace(/\/$/, '')}/app/support-tickets/${ticket.id}`;
    const preview = this.sanitizeText(replyBody).slice(0, 160);

    await this.emailService.sendEmail({
      to: supportEmail,
      subject: `رد مستخدم على التذكرة ${ticket.number}`,
      html: buildSupportTicketEmailHtml({
        ticketNumber: ticket.number,
        subject: ticket.subject,
        headline: 'رد جديد من المستخدم',
        body: `أرسل المستخدم رداً جديداً على التذكرة.<br/><br/><em>${preview}</em>`,
        ctaLabel: 'متابعة في HQ',
        ticketUrl: ticketAdminUrl,
        preview,
      }),
    });
  }
}
