import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileCategory } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MailMailboxSessionService } from './mail-mailbox-session.service';
import { S3Service } from '../../shared/services/s3.service';

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 10;

const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.ps1',
  '.vbs',
  '.js',
  '.jar',
  '.sh',
]);

@Injectable()
export class MailAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly s3: S3Service,
    private readonly access: MailAppAccessService,
    private readonly mailboxSessions: MailMailboxSessionService,
  ) {}

  private extension(filename: string) {
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  }

  private toView(row: {
    id: string;
    filename: string;
    contentType: string;
    sizeBytes: number;
    contentId: string | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      filename: row.filename,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      contentId: row.contentId,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async upload(
    userId: string,
    appId: string,
    mailboxId: string,
    file: Express.Multer.File,
    sessionToken?: string,
    messageId?: string,
  ) {
    if (!file?.buffer?.length && !file?.size) {
      throw new BadRequestException('No file uploaded.');
    }
    const size = file.size ?? file.buffer?.length ?? 0;
    if (size > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException('Attachment must be 10 MB or smaller.');
    }
    const ext = this.extension(file.originalname || '');
    if (BLOCKED_EXTENSIONS.has(ext)) {
      throw new BadRequestException('This file type is not allowed.');
    }

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId,
    });
    const access = await this.access.requireAccess(userId, appId);

    if (messageId) {
      const message = await this.prisma.mailMessage.findFirst({
        where: {
          id: messageId,
          mailboxId,
          userId: access.app.userId,
        },
        include: { attachments: { select: { id: true } } },
      });
      if (!message) throw new NotFoundException('Message not found.');
      if (message.attachments.length >= MAX_ATTACHMENTS_PER_MESSAGE) {
        throw new BadRequestException('Too many attachments on this message.');
      }
    }

    const attachmentId = randomUUID();
    const key = this.s3.getMailMessageAttachmentKey(
      access.app.userId,
      appId,
      mailboxId,
      attachmentId,
      file.originalname || 'attachment',
    );

    await this.storage.uploadMailMessageAttachment(
      access.app.userId,
      appId,
      mailboxId,
      attachmentId,
      file,
      key,
    );

    const row = await this.prisma.mailAttachment.create({
      data: {
        id: attachmentId,
        messageId: messageId ?? null,
        mailboxId,
        userId: access.app.userId,
        filename: file.originalname || 'attachment',
        contentType: file.mimetype || 'application/octet-stream',
        sizeBytes: size,
        s3Key: key,
      },
    });

    return { attachment: this.toView(row) };
  }

  async linkToMessage(messageId: string, attachmentIds: string[]) {
    if (!attachmentIds.length) return;
    await this.prisma.mailAttachment.updateMany({
      where: { id: { in: attachmentIds }, messageId: null },
      data: { messageId },
    });
  }

  async assertOwned(
    userId: string,
    appId: string,
    attachmentIds: string[],
    mailboxId: string,
  ) {
    if (!attachmentIds.length) return [];
    const access = await this.access.requireAccess(userId, appId);
    const rows = await this.prisma.mailAttachment.findMany({
      where: {
        id: { in: attachmentIds },
        mailboxId,
        userId: access.app.userId,
      },
    });
    if (rows.length !== attachmentIds.length) {
      throw new BadRequestException('One or more attachments were not found.');
    }
    return rows;
  }

  async loadBuffers(
    attachmentIds: string[],
  ): Promise<
    Array<{
      filename: string;
      contentType: string;
      content: Buffer;
    }>
  > {
    if (!attachmentIds.length) return [];
    const rows = await this.prisma.mailAttachment.findMany({
      where: { id: { in: attachmentIds } },
    });
    const out: Array<{
      filename: string;
      contentType: string;
      content: Buffer;
    }> = [];
    for (const row of rows) {
      const content = await this.storage.readMailAttachmentBuffer(row.s3Key);
      out.push({
        filename: row.filename,
        contentType: row.contentType,
        content,
      });
    }
    return out;
  }

  async listForMessage(messageId: string) {
    const rows = await this.prisma.mailAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toView(row));
  }

  async storeInboundParts(input: {
    userId: string;
    appId: string;
    mailboxId: string;
    messageId: string;
    parts: Array<{
      filename: string;
      contentType: string;
      content: Buffer;
    }>;
  }) {
    for (const part of input.parts.slice(0, MAX_ATTACHMENTS_PER_MESSAGE)) {
      if (part.content.length > MAX_ATTACHMENT_BYTES) continue;
      const attachmentId = randomUUID();
      const key = this.s3.getMailMessageAttachmentKey(
        input.userId,
        input.appId,
        input.mailboxId,
        attachmentId,
        part.filename,
      );
      await this.storage.uploadBufferForMailAttachment(
        input.userId,
        attachmentId,
        key,
        part.content,
        part.contentType,
      );
      await this.prisma.mailAttachment.create({
        data: {
          id: attachmentId,
          messageId: input.messageId,
          mailboxId: input.mailboxId,
          userId: input.userId,
          filename: part.filename,
          contentType: part.contentType,
          sizeBytes: part.content.length,
          s3Key: key,
        },
      });
    }
  }

  async getDownloadUrl(
    userId: string,
    appId: string,
    messageId: string,
    attachmentId: string,
    sessionToken?: string,
  ) {
    const access = await this.access.requireAccess(userId, appId);
    const row = await this.prisma.mailAttachment.findFirst({
      where: {
        id: attachmentId,
        messageId,
        userId: access.app.userId,
        message: { mailbox: { mailAppId: access.app.id } },
      },
    });
    if (!row) throw new NotFoundException('Attachment not found.');

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId: row.mailboxId,
    });

    const url = await this.storage.getSignedUrlForKey(row.s3Key);
    return {
      attachment: this.toView(row),
      url,
    };
  }
}
