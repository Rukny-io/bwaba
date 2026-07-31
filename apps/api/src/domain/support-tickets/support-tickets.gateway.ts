import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../core/database/prisma/prisma.service';

export type SupportTicketMessagePayload = {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isStaff: boolean;
  isInternal?: boolean;
  createdAt: Date | string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }>;
};

export type SupportTicketUpdatedPayload = {
  ticketId: string;
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  updatedAt?: Date | string;
  closedAt?: Date | string | null;
};

export type SupportStaffActivityPayload = {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  preview: string;
};

@Injectable()
@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV !== 'production'
        ? true
        : process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/support',
})
export class SupportTicketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportTicketsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const auth = await this.authenticate(client);
    if (!auth) {
      this.logger.warn(`Unauthorized support socket: ${client.id}`);
      client.disconnect(true);
      return;
    }

    const { userId, role } = auth;
    (client as Socket & { userId?: string; role?: Role }).userId = userId;
    (client as Socket & { userId?: string; role?: Role }).role = role;

    client.join(`user:${userId}`);
    if (role === Role.ADMIN) {
      client.join('support-staff');
    }

    this.logger.log(`Support socket connected: ${client.id} (user ${userId})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Support socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-ticket')
  async handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId?: string },
  ) {
    const ticketId = data?.ticketId;
    const userId = (client as Socket & { userId?: string }).userId;
    const role = (client as Socket & { role?: Role }).role;

    if (!ticketId || !userId) {
      return { success: false, message: 'Invalid join request' };
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true },
    });

    if (!ticket) {
      return { success: false, message: 'Ticket not found' };
    }

    const isOwner = ticket.userId === userId;
    const isStaff = role === Role.ADMIN;

    if (!isOwner && !isStaff) {
      return { success: false, message: 'Access denied' };
    }

    client.join(`ticket:${ticketId}`);
    if (isStaff) {
      client.join(`ticket:${ticketId}:staff`);
    }

    return { success: true, ticketId };
  }

  @SubscribeMessage('leave-ticket')
  handleLeaveTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId?: string },
  ) {
    const ticketId = data?.ticketId;
    if (!ticketId) {
      return { success: false };
    }

    client.leave(`ticket:${ticketId}`);
    client.leave(`ticket:${ticketId}:staff`);
    return { success: true };
  }

  emitPublicMessage(ticketId: string, message: SupportTicketMessagePayload) {
    this.server.to(`ticket:${ticketId}`).emit('ticket-message', {
      ticketId,
      message,
    });
  }

  emitInternalMessage(ticketId: string, message: SupportTicketMessagePayload) {
    this.server.to(`ticket:${ticketId}:staff`).emit('ticket-internal', {
      ticketId,
      message,
    });
  }

  emitTicketUpdated(
    ticketId: string,
    userId: string,
    update: SupportTicketUpdatedPayload,
  ) {
    const payload = { ticketId, ...update };
    this.server.to(`ticket:${ticketId}`).emit('ticket-updated', payload);
    this.server.to(`user:${userId}`).emit('ticket-updated', payload);
  }

  emitStaffActivity(activity: SupportStaffActivityPayload) {
    this.server.to('support-staff').emit('staff-activity', activity);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { ticketId?: string; isTyping?: boolean },
  ) {
    const ticketId = data?.ticketId;
    const userId = (client as Socket & { userId?: string }).userId;
    const role = (client as Socket & { role?: Role }).role;

    if (!ticketId || !userId) {
      return { success: false };
    }

    client.to(`ticket:${ticketId}`).emit('ticket-typing', {
      ticketId,
      userId,
      isStaff: role === Role.ADMIN,
      isTyping: Boolean(data?.isTyping),
    });

    return { success: true };
  }

  private async authenticate(
    client: Socket,
  ): Promise<{ userId: string; role: Role } | null> {
    try {
      const token =
        (client.handshake.auth as { token?: string })?.token ||
        (client.handshake.headers?.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.substring(7)
          : undefined);

      if (!token) return null;

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: string; type?: string; purpose?: string }>(
        token,
        { secret },
      );

      if (payload.type === 'ws_token' && payload.purpose === 'websocket') {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: { id: true, role: true },
        });
        if (!user) return null;
        return { userId: user.id, role: user.role };
      }

      const sessionPayload = payload as { sub: string; sid?: string };
      const sessionId = sessionPayload.sid;
      if (!sessionId) return null;

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { select: { id: true, role: true } } },
      });

      if (!session || session.userId !== sessionPayload.sub || session.isRevoked) {
        return null;
      }

      return { userId: session.user.id, role: session.user.role };
    } catch {
      return null;
    }
  }
}
