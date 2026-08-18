import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { enableInstagramWebhookSubscriptions } from './instagram-webhook.util';

const IG_GRAPH_BASE = 'https://graph.instagram.com/v22.0';
const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export type InboxChannelFilter = 'all' | 'instagram' | 'messenger';

@Injectable()
export class InstagramInboxService {
  private readonly logger = new Logger(InstagramInboxService.name);

  private get conversationModel(): any {
    return (this.prisma as any).instagramInboxConversation;
  }

  private get messageModel(): any {
    return (this.prisma as any).instagramInboxMessage;
  }

  private get connectionModel(): any {
    return (this.prisma as any).instagramConnection;
  }

  constructor(private readonly prisma: PrismaService) {}

  /** Process Instagram messaging webhook payload (object: instagram). */
  async processWebhookPayload(payload: any): Promise<void> {
    if (payload.object !== 'instagram' && payload.object !== 'page') {
      this.logger.debug(
        `Ignored webhook object type: ${String(payload.object)}`,
      );
      return;
    }

    this.logger.log(
      `Processing ${payload.object} webhook with ${payload.entry?.length ?? 0} entries`,
    );

    for (const entry of payload.entry || []) {
      const igUserId = entry.id ? String(entry.id) : null;
      if (!igUserId) continue;

      for (const messaging of entry.messaging || []) {
        await this.processMessagingEvent(igUserId, messaging);
      }

      for (const change of entry.changes || []) {
        if (change.field === 'messages' && change.value) {
          await this.processMessagingEvent(igUserId, change.value);
        }
      }
    }
  }

  private async processMessagingEvent(
    igUserId: string,
    event: any,
  ): Promise<void> {
    const message = event.message;
    if (!message || message.is_deleted) return;

    const senderId = String(event.sender?.id ?? '');
    const recipientId = String(event.recipient?.id ?? '');
    if (!senderId || !recipientId) return;

    const conn = await this.findConnectionForMessagingEvent(
      igUserId,
      senderId,
      recipientId,
    );
    if (!conn) {
      this.logger.warn(
        `No Instagram connection for entry.id=${igUserId} sender=${senderId} recipient=${recipientId}`,
      );
      return;
    }

    const isEcho = Boolean(message.is_echo);
    const participantIgId = isEcho ? recipientId : senderId;
    const direction = isEcho ? 'OUTBOUND' : 'INBOUND';
    const igMessageId = message.mid ? String(message.mid) : null;

    if (igMessageId) {
      const existing = await this.messageModel.findUnique({
        where: { igMessageId },
      });
      if (existing) return;
    }

    const { text, messageType } = this.extractMessageContent(message);
    const sentAt = event.timestamp
      ? new Date(Number(event.timestamp))
      : new Date();

    const messagingWindowExpiresAt = isEcho
      ? undefined
      : new Date(sentAt.getTime() + MESSAGING_WINDOW_MS);

    const conversation = await this.conversationModel.upsert({
      where: {
        connectionId_participantIgId: {
          connectionId: conn.id,
          participantIgId,
        },
      },
      create: {
        connectionId: conn.id,
        participantIgId,
        participantName: null,
        lastMessageAt: sentAt,
        lastMessageText: text,
        unreadCount: direction === 'INBOUND' ? 1 : 0,
        messagingWindowExpiresAt: messagingWindowExpiresAt ?? null,
      },
      update: {
        lastMessageAt: sentAt,
        lastMessageText: text,
        ...(direction === 'INBOUND'
          ? { unreadCount: { increment: 1 } }
          : {}),
        ...(messagingWindowExpiresAt
          ? { messagingWindowExpiresAt }
          : {}),
      },
    });

    await this.messageModel.create({
      data: {
        conversationId: conversation.id,
        direction,
        igMessageId,
        text,
        messageType,
        sentAt,
        rawPayload: event,
      },
    });

    if (direction === 'INBOUND') {
      void this.tryEnrichParticipantProfile(conn, conversation.id, participantIgId);
    }
  }

  private async findConnectionForMessagingEvent(
    entryIgUserId: string,
    senderId: string,
    recipientId: string,
  ) {
    const candidateIds = [
      entryIgUserId,
      senderId,
      recipientId,
    ].filter(Boolean);

    for (const igUserId of candidateIds) {
      const conn = await this.connectionModel.findFirst({
        where: { igUserId },
      });
      if (conn) return conn;
    }

    return null;
  }

  private extractMessageContent(message: any): {
    text: string | null;
    messageType: string;
  } {
    if (message.text) {
      return { text: String(message.text), messageType: 'text' };
    }

    const attachment = message.attachments?.[0];
    if (attachment?.type) {
      const label =
        attachment.type === 'image'
          ? 'صورة'
          : attachment.type === 'video'
            ? 'فيديو'
            : attachment.type === 'audio'
              ? 'رسالة صوتية'
              : attachment.type === 'share'
                ? 'مشاركة'
                : 'مرفق';
      return { text: `[${label}]`, messageType: String(attachment.type) };
    }

    if (message.is_unsupported) {
      return { text: '[رسالة غير مدعومة]', messageType: 'unsupported' };
    }

    return { text: null, messageType: 'unknown' };
  }

  private async tryEnrichParticipantProfile(
    conn: { id: string; accessToken: string },
    conversationId: string,
    participantIgId: string,
  ): Promise<void> {
    try {
      const params = new URLSearchParams({
        fields: 'name,username,profile_pic',
        access_token: conn.accessToken,
      });
      const res = await fetch(
        `${IG_GRAPH_BASE}/${participantIgId}?${params.toString()}`,
      );
      if (!res.ok) return;

      const profile = (await res.json()) as {
        name?: string;
        username?: string;
        profile_pic?: string;
      };

      await this.conversationModel.update({
        where: { id: conversationId },
        data: {
          participantName: profile.name ?? undefined,
          participantUsername: profile.username ?? undefined,
          participantPicUrl: profile.profile_pic ?? undefined,
        },
      });
    } catch (error) {
      this.logger.debug(
        `Participant profile fetch failed for ${participantIgId}: ${String(error)}`,
      );
    }
  }

  private ensureWebhookSubscriptionsForConnections(
    connections: Array<{
      accessToken: string;
      tokenExpiry: Date | null;
    }>,
  ): void {
    const now = Date.now();

    for (const conn of connections) {
      const tokenStillValid =
        !conn.tokenExpiry || new Date(conn.tokenExpiry).getTime() > now;
      if (!tokenStillValid) continue;

      void enableInstagramWebhookSubscriptions(conn.accessToken).then(
        (result) => {
          if (!result.ok) {
            this.logger.warn(
              `subscribed_apps failed: ${result.error ?? 'unknown error'}`,
            );
          }
        },
      );
    }
  }

  async listConversations(
    userId: string,
    channel: InboxChannelFilter = 'all',
  ) {
    if (channel === 'messenger') {
      return [];
    }

    const connections = await this.connectionModel.findMany({
      where: { userId },
      select: { id: true, accessToken: true, tokenExpiry: true },
    });
    const connectionIds = connections.map((c: { id: string }) => c.id);
    if (connectionIds.length === 0) return [];

    this.ensureWebhookSubscriptionsForConnections(connections);

    const rows = await this.conversationModel.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { lastMessageAt: 'desc' },
    });

    return rows.map((row: any) => this.toPublicConversation(row));
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await this.requireOwnedConversation(
      userId,
      conversationId,
    );

    const messages = await this.messageModel.findMany({
      where: { conversationId: conversation.id },
      orderBy: { sentAt: 'asc' },
    });

    return {
      conversation: this.toPublicConversation(conversation),
      messages: messages.map((m: any) => this.toPublicMessage(m)),
    };
  }

  async sendMessage(userId: string, conversationId: string, text: string) {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw new BadRequestException('نص الرسالة مطلوب');
    }

    const conversation = await this.requireOwnedConversation(
      userId,
      conversationId,
    );
    const conn = conversation.connection;

    if (conn.tokenExpiry && new Date(conn.tokenExpiry) < new Date()) {
      throw new BadRequestException({
        message: 'انتهت صلاحية توكن إنستغرام. يرجى إعادة ربط حسابك.',
        tokenExpired: true,
      });
    }

    if (
      conversation.messagingWindowExpiresAt &&
      new Date(conversation.messagingWindowExpiresAt) < new Date()
    ) {
      throw new BadRequestException(
        'انتهت نافذة الرد (24 ساعة). انتظر رسالة جديدة من العميل.',
      );
    }

    const payload = {
      recipient: { id: conversation.participantIgId },
      message: { text: trimmed },
    };

    const res = await fetch(`${IG_GRAPH_BASE}/${conn.igUserId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${conn.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.warn(`Instagram send failed: ${errText}`);
      throw new BadRequestException(`تعذر إرسال الرسالة: ${errText}`);
    }

    const data = (await res.json()) as {
      message_id?: string;
      recipient_id?: string;
    };
    const sentAt = new Date();
    const igMessageId = data.message_id ? String(data.message_id) : null;

    if (igMessageId) {
      const existing = await this.messageModel.findUnique({
        where: { igMessageId },
      });
      if (existing) {
        return {
          message: this.toPublicMessage(existing),
          conversation: this.toPublicConversation(conversation),
        };
      }
    }

    const message = await this.messageModel.create({
      data: {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        igMessageId,
        text: trimmed,
        messageType: 'text',
        sentAt,
      },
    });

    const updatedConversation = await this.conversationModel.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: sentAt,
        lastMessageText: trimmed,
      },
    });

    return {
      message: this.toPublicMessage(message),
      conversation: this.toPublicConversation(updatedConversation),
    };
  }

  async markConversationRead(userId: string, conversationId: string) {
    const conversation = await this.requireOwnedConversation(
      userId,
      conversationId,
    );

    if (conversation.unreadCount === 0) {
      return {
        success: true,
        conversation: this.toPublicConversation(conversation),
      };
    }

    const updated = await this.conversationModel.update({
      where: { id: conversation.id },
      data: { unreadCount: 0 },
    });

    return {
      success: true,
      conversation: this.toPublicConversation(updated),
    };
  }

  private async requireOwnedConversation(userId: string, conversationId: string) {
    const conversation = await this.conversationModel.findFirst({
      where: {
        id: conversationId,
        connection: { userId },
      },
      include: { connection: true },
    });

    if (!conversation) {
      throw new NotFoundException('المحادثة غير موجودة');
    }

    return conversation;
  }

  private toPublicConversation(row: any) {
    return {
      id: row.id,
      channel: 'instagram' as const,
      connectionId: row.connectionId,
      participantName:
        row.participantName ??
        row.participantUsername ??
        row.participantIgId,
      participantUsername: row.participantUsername ?? null,
      participantAvatarUrl: row.participantPicUrl ?? null,
      preview: row.lastMessageText ?? '',
      updatedAt: new Date(row.lastMessageAt).toISOString(),
      unreadCount: row.unreadCount ?? 0,
      messagingWindowExpiresAt: row.messagingWindowExpiresAt
        ? new Date(row.messagingWindowExpiresAt).toISOString()
        : null,
    };
  }

  private toPublicMessage(row: any) {
    return {
      id: row.id,
      conversationId: row.conversationId,
      direction: row.direction === 'OUTBOUND' ? 'outbound' : 'inbound',
      body: row.text ?? '',
      messageType: row.messageType ?? 'text',
      sentAt: new Date(row.sentAt).toISOString(),
    };
  }
}
