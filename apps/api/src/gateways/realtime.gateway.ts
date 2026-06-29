import { createAdapter } from '@socket.io/redis-adapter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { parse } from 'cookie';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  afterInit(server: Server) {
    const redisUrl =
      this.config.get<string>('redis.url') ?? 'redis://localhost:6379';
    const pubClient = new Redis(redisUrl);
    const subClient = pubClient.duplicate();
    server.adapter(createAdapter(pubClient, subClient));
    this.logger.log('RealtimeGateway initialised with Redis adapter');
  }

  async handleConnection(socket: Socket) {
    try {
      const cookieHeader = socket.handshake.headers.cookie ?? '';
      const cookies = parse(cookieHeader);
      const token = cookies['access_token'];

      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{ sub: string; email: string }>(
        token,
        {
          secret: this.config.get<string>('jwt.accessSecret'),
        },
      );

      socket.data['userId'] = payload.sub;

      // Join personal room
      await socket.join(`user:${payload.sub}`);

      // Join all org and workspace rooms this user belongs to
      const memberships = await this.prisma.organizationMember.findMany({
        where: { userId: payload.sub },
        include: {
          workspaceMembers: { include: { workspace: true } },
          organization: true,
        },
      });

      for (const m of memberships) {
        await socket.join(`org:${m.organizationId}`);
        for (const wm of m.workspaceMembers) {
          await socket.join(`workspace:${wm.workspaceId}`);
        }
      }

      this.logger.debug(`Socket ${socket.id} connected (user=${payload.sub})`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Socket ${socket.id} disconnected`);
  }

  emitToWorkspace(workspaceId: string, event: string, data: unknown) {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }

  emitToOrg(orgId: string, event: string, data: unknown) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
